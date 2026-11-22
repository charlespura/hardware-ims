import type { SVGAttributes } from 'react';

/** A hex nut — simple, recognisable, and works at 16px. */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinejoin="round"
            {...props}
        >
            <path d="M12 2.6 20.2 7.3v9.4L12 21.4l-8.2-4.7V7.3Z" fill="none" />
            <circle cx="12" cy="12" r="3.4" fill="none" />
        </svg>
    );
}
