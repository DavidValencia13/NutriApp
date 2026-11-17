// Iconos propios de NutriApp. SVG locales para que el menú se vea igual sin conexión externa.
const dibujo = {
  objetivo: <>
    <circle cx="15" cy="17" r="10" fill="#dcfff0" stroke="#087d66" />
    <circle cx="15" cy="17" r="5.8" fill="#9af4c0" stroke="#087d66" />
    <circle cx="15" cy="17" r="1.9" fill="#087d66" stroke="none" />
    <path d="m17 15 8-8m-2-2 4 1-1 4" stroke="#02a67e" strokeWidth="2.2" />
    <path d="M24 7c.3-3 2.2-4.2 5-4-.4 2.6-2 4-5 4Z" fill="#43cf8f" stroke="#087d66" />
  </>,
  calorias: <>
    <path d="M17 3c1.5 5-1 7.5-2.7 10.4C12.5 11.4 12 9 12 7 6.4 13 7 17.5 8.1 21.1c1 4.2 4.4 7 8.1 7 4.8 0 8.5-3.7 8.5-8.5 0-4.5-2.5-7.2-4-8.6.5 3-1 5.1-2.5 6C18 12.6 19.2 8.1 17 3Z" fill="#7be9b1" stroke="#087d66" />
    <path d="M17 16c-.3 2.4-3.7 3.7-3.7 6.5a3.6 3.6 0 0 0 7.2 0c0-2-1.7-3.3-2-5.2-.6 1.1-1 1.6-1.5 1.9-.2-1.4.1-2.4 0-3.2Z" fill="#fff6ba" stroke="#df9b27" strokeWidth="1.3" />
  </>,
  proteinas: <>
    <path d="M5 17c4.8-6 10.7-8.3 17.5-5l5-3v6l-2.3 2 2.3 2v6l-5-3C15.7 25.3 9.8 23 5 17Z" fill="#bcefff" stroke="#1285aa" />
    <circle cx="20" cy="15" r="1.2" fill="#086586" stroke="none" />
    <path d="M9 18c3.5-.4 6.3 1.4 9.2 4" stroke="#1285aa" strokeWidth="1.4" />
    <path d="M10 14c2.6.6 4 1.7 5 3" stroke="#1285aa" strokeWidth="1.2" />
  </>,
  carbohidratos: <>
    <path d="M16 28V7" stroke="#a66b18" strokeWidth="2" />
    <path d="M16 23c-6 0-8-2.8-8-6 4.5-.3 7 1.7 8 6Zm0-5c5.8-.1 8-2.8 8-6-4.7-.1-7.2 1.8-8 6Zm0-5c-5.4-.2-7.2-2.9-7-5.8 4.2.1 6.4 2 7 5.8Zm0-4c4.6-.8 6.2-3.2 5.8-6-3.8.5-5.6 2.5-5.8 6Z" fill="#ffe39b" stroke="#b47d23" strokeWidth="1.3" />
    <path d="M16 7c-2-2.7-1.8-4.4 0-6 1.8 1.6 2 3.3 0 6Z" fill="#ffca68" stroke="#b47d23" strokeWidth="1.2" />
  </>,
  grasas: <>
    <path d="M16 2C13 7.7 8 13.2 8 19a8 8 0 0 0 16 0c0-5.8-5-11.3-8-17Z" fill="#b9f0ff" stroke="#1689ad" />
    <path d="M12 20a4 4 0 0 0 4 4" stroke="#fff" strokeWidth="2.2" />
    <circle cx="20" cy="17" r="1.1" fill="#fff" stroke="none" />
  </>,
  fibra: <>
    <path d="M5 25C5 13 13 6 27 5c-.2 13.5-7 21-18 21-1.5 0-2.8-.3-4-.8Z" fill="#9bf3bd" stroke="#148760" />
    <path d="M5 27c4-6.8 8.9-11 18-17M13 18l-1-7m6 3 6 2" stroke="#148760" strokeWidth="1.5" />
  </>,
  desayuno: <>
    <circle cx="16" cy="10" r="4.3" fill="#ffd66e" stroke="#dd941c" />
    <path d="M16 2v2m0 12v2M8 10H6m20 0h-2M9 3l1.4 1.4M23 3l-1.4 1.4" stroke="#e7a327" />
    <path d="M5 19h22c-.8 5.7-4.2 8-11 8S5.8 24.7 5 19Z" fill="#b6f5da" stroke="#07836a" />
    <path d="M4 19h24M10 22h12" stroke="#07836a" />
  </>,
  almuerzo: <>
    <circle cx="17" cy="17" r="10" fill="#e8f9ff" stroke="#1b91a5" />
    <circle cx="17" cy="17" r="6.2" fill="#fff" stroke="#1b91a5" strokeWidth="1.2" />
    <path d="M3 5v10m3-10v10M3 11h3m-1.5 4v13M29 5c-2.3 2-3.5 6-3.5 10H29V5Zm-1.7 10V28" stroke="#07836a" strokeWidth="1.8" />
    <path d="M15 18c2.3-4 5.3-4.5 7-3.6-1 3-3.3 4.7-7 3.6Z" fill="#87e9a8" stroke="#159869" strokeWidth="1.1" />
  </>,
  merienda: <>
    <path d="M15 8c-2.7-3.1-2.7-5.1-1.6-6.2 2.8.5 4.2 2.1 4.6 5.2" fill="#b0f3aa" stroke="#27875b" />
    <path d="M16.5 9c4.1-2 9-1.7 11 3.7 2 5.4-1.7 14.3-6.2 15.3-2.3.5-3.6-.8-5.3-.8s-3 1.3-5.3.8C6.2 27 2.5 18.1 4.5 12.7c2-5.4 7-5.7 12-3.7Z" fill="#ffc9a6" stroke="#d46d4b" />
    <path d="M16 9c0-3 2-5 5-6" stroke="#27875b" strokeWidth="1.7" />
    <path d="M8 14c-1.1 2.5-.5 5.5.8 7" stroke="#fff5e7" strokeWidth="2" />
  </>,
  cena: <>
    <path d="M22.5 3.5A12 12 0 1 0 28 21c-8.7 1-14.7-7.3-5.5-17.5Z" fill="#d3ddff" stroke="#4262ad" />
    <circle cx="7" cy="5" r="1.3" fill="#85e8c6" stroke="none" />
    <path d="m27 4 .7 2.3L30 7l-2.3.7L27 10l-.7-2.3L24 7l2.3-.7L27 4Z" fill="#f1d774" stroke="none" />
  </>,
  comida: <>
    <circle cx="16" cy="16" r="11" fill="#e7fbf5" stroke="#07836a" />
    <circle cx="16" cy="16" r="6.5" fill="#fff" stroke="#07836a" strokeWidth="1.2" />
    <path d="M16 18c-2.2-3.5-1.3-5.2 1-6.7 2.8 2.4 3 4.4-1 6.7Z" fill="#7be0a2" stroke="#07836a" strokeWidth="1.2" />
  </>,
};

export default function NutriIcon({ name, size = 20, className = "" }) {
  return <svg aria-hidden="true" focusable="false" className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{dibujo[name] || dibujo.comida}</svg>;
}
