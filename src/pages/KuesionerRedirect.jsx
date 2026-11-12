import React, { useEffect } from 'react';

const TARGET_URL = 'https://forms.gle/DjSMFttWzrQL2uEU9';

export default function KuesionerRedirect() {
  useEffect(() => {
    // Redirect langsung seketika
    window.location.replace(TARGET_URL);
  }, []);

  return (
    <div className="min-h-screen bg-[#181818] text-[#fcfbf9] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-10 h-10 border-2 border-[#8c7355] border-t-transparent rounded-full animate-spin mb-4" />
      <h1 className="font-display font-bold text-xl sm:text-2xl text-[#fcfbf9] tracking-tight">
        Mengarahkan ke Kuesioner...
      </h1>
      <p className="font-mono text-xs text-[#8c857b] mt-2">
        Jika tidak otomatis dialihkan dalam beberapa detik,{' '}
        <a
          href={TARGET_URL}
          className="text-[#8c7355] underline hover:text-[#fcfbf9] transition-colors"
        >
          klik di sini
        </a>
        .
      </p>
    </div>
  );
}
