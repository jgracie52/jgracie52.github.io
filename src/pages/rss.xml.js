import rss from '@astrojs/rss';
import { SITE_TITLE, SITE_DESCRIPTION } from '../config';

export async function GET(context) {
	const posts = await Promise.all(
		Object.values(import.meta.glob('./blog/**/*.{md,mdx}')).map(async (post) => {
			const { frontmatter, url } = await post();
			return {
				title: frontmatter.title,
				description: frontmatter.description,
				pubDate: frontmatter.pubDate,
				link: url,
			};
		})
	);

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts,
	});
}
