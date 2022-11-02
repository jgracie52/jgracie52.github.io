/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {},
	},
	plugins: [require("@tailwindcss/typography"),require("daisyui")],
	daisyui: {
		themes: [
		  {
			mytheme: {
				"primary": "#9333ea",		
				"secondary": "#3b82f6",	
				"accent": "#67e8f9",
				"neutral": "#191D24",
				"base-100": "#2A303C",	
				"info": "#3ABFF8",		
				"success": "#22c55e",	
				"warning": "#FBBD23",	
				"error": "#ef4444",
			},
		  },
		],
	  },
}
