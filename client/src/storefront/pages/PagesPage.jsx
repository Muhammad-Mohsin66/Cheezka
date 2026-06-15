import { useMemo } from 'react';
import pagesTemplate from '../templates/pages.html?raw';
import { extractBodyMarkup } from '../utils/template';
import { usePagesPage } from '../hooks/pageHooks';

export default function PagesPage() {
  usePagesPage();
  const bodyMarkup = useMemo(() => extractBodyMarkup(pagesTemplate), []);
  return <div className="page-root" dangerouslySetInnerHTML={{ __html: bodyMarkup }} />;
}

