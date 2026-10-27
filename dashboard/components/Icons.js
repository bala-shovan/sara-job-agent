const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const External = () => (<svg {...base}><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>);
export const Check = () => (<svg {...base}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>);
export const Cross = () => (<svg {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const ThumbUp = () => (<svg {...base}><path d="M7 10v10H4V10h3z" /><path d="M7 10l4-7a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7" /></svg>);
export const ThumbDown = () => (<svg {...base}><path d="M7 14V4H4v10h3z" /><path d="M7 14l4 7a2 2 0 0 0 2-2v-4h5.5a2 2 0 0 0 2-2.3l-1.2-7A2 2 0 0 0 17.3 4H7" /></svg>);
export const Flag = () => (<svg {...base} style={{ width: 14, height: 14, flex: 'none', transform: 'translateY(2px)' }}><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></svg>);
