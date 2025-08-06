import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import { tokens } from "./src/styles/tokens";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
                extend: {
                        colors: tokens.colors,
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-config': 'var(--gradient-config)',
				'gradient-subtle': 'var(--gradient-subtle)'
			},
			boxShadow: {
				'elegant': 'var(--shadow-elegant)',
				'card': 'var(--shadow-card)',
				'hover': 'var(--shadow-hover)',
				'form': 'var(--shadow-form)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
                        animation: {
                                'accordion-down': 'accordion-down 0.2s ease-out',
                                'accordion-up': 'accordion-up 0.2s ease-out'
                        },
                        fontFamily: {
                                playfair: ['"Playfair Display"', 'serif'],
                        },
                        fontSize: tokens.typography,
                        spacing: tokens.spacing,
                }
        },
        plugins: [tailwindcssAnimate],
} satisfies Config;
