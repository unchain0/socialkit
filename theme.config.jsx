import { useConfig } from 'nextra-theme-docs';

import { Logo } from './components/logo';

const REPO = 'https://github.com/unchain0/socialkit';

export default {
  logo: <Logo />,
  project: {
    link: REPO,
  },
  docsRepositoryBase: REPO,
  useNextSeoProps() {
    return {
      titleTemplate: 'Documentation - SocialKit',
      openGraph: {
        title: 'Documentation | SocialKit - Analyze Social Media Videos with a simple API',
        description:
          'SocialKit is a powerful API for analyzing social media videos, extracting summaries, transcripts, and engagement metrics from YouTube, TikTok, Instagram, and more.',
      },
    };
  },
  head() {
    const config = useConfig();
    const title = `${config.title} | SocialKit`;
    const description =
      'SocialKit is a powerful API for analyzing social media videos, extracting summaries, transcripts, and engagement metrics from YouTube, TikTok, Instagram, and more.';

    return (
      <>
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <meta property="description" content={description} />
        <meta property="og:description" content={description} />
      </>
    );
  },
  footer: {
    text: 'SocialKit Docs',
  },
};
