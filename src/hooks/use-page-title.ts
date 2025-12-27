import { useEffect } from 'react';

const BASE_TITLE = 'Music DNA';

const PAGE_TITLES: Record<string, string> = {
  landing: 'Do You Know Who You Are as a Listener?',
  home: 'Your Musical Identity',
  crates: 'Your Crates',
  studio: 'Studio',
};

export function usePageTitle(title?: string, pageKey?: keyof typeof PAGE_TITLES) {
  useEffect(() => {
    const previousTitle = document.title;
    
    if (pageKey && PAGE_TITLES[pageKey]) {
      document.title = `${PAGE_TITLES[pageKey]} | ${BASE_TITLE}`;
    } else if (title) {
      document.title = `${title} | ${BASE_TITLE}`;
    } else {
      document.title = `Do You Know Who You Are as a Listener? | ${BASE_TITLE}`;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title, pageKey]);
}