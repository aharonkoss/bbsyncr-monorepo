import { Metadata } from 'next';
import RegisterPageClient from './RegisterPageClient';

type Props = {
  params: Promise<{ company_slug: string; manager_id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { company_slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.bbsynr.com';

  return {
    title: 'Register for the BBSynr Portal',
    description: `Join BBSynr and start managing your real estate documents.`,
    openGraph: {
      title: 'Register for the BBSynr Mobile App',
      description: 'Join your BBsynr team to sign your docs on your phone.',
      url: `${baseUrl}/${company_slug}/register`,
      siteName: 'BBSynr',
      images: [
        {
          url: `${baseUrl}/og-register.jpg`,  // absolute URL required
          width: 1200,
          height: 630,
          alt: 'Register for the BBSynr Mobile App.',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Register for the BBSynr Portal',
      description: 'Join your team and manage real estate documents with BBSynr.',
      images: [`${baseUrl}/og-register.jpg`],
    },
  };
}

export default function Page() {
  return <RegisterPageClient />;
}
