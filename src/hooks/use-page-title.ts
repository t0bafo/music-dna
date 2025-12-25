import { useEffect } from 'react';

const BASE_TITLE = 'Music DNA';

export function usePageTitle(title?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    
    if (title) {
      document.title = `${title} | ${BASE_TITLE}`;
    } else {
      document.title = `What's Your Music Personality? | ${BASE_TITLE}`;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
