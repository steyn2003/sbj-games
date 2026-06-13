import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="ppp-beer" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#fbbf24" />
                    <stop offset="1" stopColor="#d97706" />
                </linearGradient>
            </defs>
            <path
                d="M330 218 a72 72 0 0 1 0 144"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="36"
                strokeLinecap="round"
            />
            <rect x="150" y="200" width="180" height="190" rx="28" fill="url(#ppp-beer)" stroke="#fde68a" strokeWidth="6" />
            <g fill="#f8fafc">
                <rect x="150" y="188" width="180" height="40" rx="20" />
                <circle cx="178" cy="196" r="36" />
                <circle cx="220" cy="178" r="42" />
                <circle cx="268" cy="184" r="40" />
                <circle cx="306" cy="200" r="34" />
            </g>
            <g fill="#fef3c7" opacity="0.75">
                <circle cx="200" cy="288" r="9" />
                <circle cx="250" cy="330" r="7" />
                <circle cx="212" cy="356" r="6" />
                <circle cx="284" cy="302" r="6" />
            </g>
        </svg>
    );
}
