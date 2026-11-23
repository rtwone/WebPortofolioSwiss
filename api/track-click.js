import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SITE_COOLDOWN_MS = 30 * 60 * 1000; // 30 menit per identitas pengunjung per domain
const SHORTLINK_COOLDOWN_MS = 10 * 60 * 1000; // 10 menit per identitas pengunjung per shortlink
const MAX_GUARD_ENTRIES = 500;

function resolveTrackedDomain(hostname) {
  const cleanHost = String(hostname || '')
    .toLowerCase()
    .trim()
    .split(':')[0]
    .replace(/^www\./, '');
  if (cleanHost === 'irfan.sang.ceo') {
    return 'irfan.sang.ceo';
  }
  return 'irfanhariyanto.my.id';
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function buildVisitorHash(ip, userAgent, scopeKey) {
  return crypto
    .createHash('sha256')
    .update(`${ip}|${userAgent}|${scopeKey}`)
    .digest('hex')
    .slice(0, 24);
}

function pruneGuardMap(guardMap, now) {
  const entries = Object.entries(guardMap || {}).filter(
    ([, ts]) => typeof ts === 'number' && now - ts < SITE_COOLDOWN_MS
  );
  // Keep only the most recent entries to keep JSONB compact
  entries.sort((a, b) => b[1] - a[1]);
  return Object.fromEntries(entries.slice(0, MAX_GUARD_ENTRIES));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ ok: false, error: 'Supabase not configured' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const type = body.type === 'shortlink' ? 'shortlink' : 'site';
    const ip = getClientIp(req);
    const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 200);
    const now = Date.now();

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error: fetchError } = await supabase
      .from('site_settings')
      .select('content')
      .eq('id', 'main')
      .maybeSingle();

    if (fetchError || !data?.content) {
      return res.status(500).json({
        ok: false,
        error: fetchError?.message || 'site_settings row not found',
      });
    }

    const dbContent = data.content;
    const guardMap = pruneGuardMap(dbContent._click_guard, now);

    if (type === 'site') {
      const host =
        body.hostname ||
        req.headers['x-forwarded-host'] ||
        req.headers.host ||
        '';
      const domainKey = resolveTrackedDomain(host);
      const visitorHash = buildVisitorHash(ip, userAgent, `site:${domainKey}`);

      const currentClicks = {
        'irfan.sang.ceo': Number(dbContent.site_clicks?.['irfan.sang.ceo']) || 0,
        'irfanhariyanto.my.id':
          Number(dbContent.site_clicks?.['irfanhariyanto.my.id']) || 0,
      };

      const lastSeen = guardMap[visitorHash];
      if (lastSeen && now - lastSeen < SITE_COOLDOWN_MS) {
        return res.status(200).json({
          ok: true,
          counted: false,
          reason: 'cooldown',
          domain: domainKey,
          site_clicks: currentClicks,
        });
      }

      const nextClicks = {
        ...currentClicks,
        [domainKey]: currentClicks[domainKey] + 1,
      };
      guardMap[visitorHash] = now;

      const { error: updateError } = await supabase
        .from('site_settings')
        .update({
          content: {
            ...dbContent,
            site_clicks: nextClicks,
            _click_guard: guardMap,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'main');

      if (updateError) {
        return res.status(500).json({ ok: false, error: updateError.message });
      }

      return res.status(200).json({
        ok: true,
        counted: true,
        domain: domainKey,
        site_clicks: nextClicks,
      });
    }

    // type === 'shortlink'
    const target = String(body.target || '').trim();
    if (!target) {
      return res.status(400).json({ ok: false, error: 'Missing shortlink target' });
    }

    const visitorHash = buildVisitorHash(
      ip,
      userAgent,
      `sl:${target.toLowerCase()}`
    );
    const dbList = Array.isArray(dbContent.shortlinks) ? dbContent.shortlinks : [];

    const lastSeen = guardMap[visitorHash];
    if (lastSeen && now - lastSeen < SHORTLINK_COOLDOWN_MS) {
      return res.status(200).json({
        ok: true,
        counted: false,
        reason: 'cooldown',
        shortlinks: dbList,
      });
    }

    let matched = false;
    const updatedList = dbList.map((item) => {
      if (
        item.id === target ||
        (item.slug || '').toLowerCase() === target.toLowerCase()
      ) {
        matched = true;
        return { ...item, clicks: (Number(item.clicks) || 0) + 1 };
      }
      return item;
    });

    if (!matched) {
      return res.status(404).json({ ok: false, error: 'Shortlink not found' });
    }

    guardMap[visitorHash] = now;

    const { error: updateError } = await supabase
      .from('site_settings')
      .update({
        content: {
          ...dbContent,
          shortlinks: updatedList,
          _click_guard: guardMap,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'main');

    if (updateError) {
      return res.status(500).json({ ok: false, error: updateError.message });
    }

    return res.status(200).json({
      ok: true,
      counted: true,
      shortlinks: updatedList,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Internal server error',
    });
  }
}
