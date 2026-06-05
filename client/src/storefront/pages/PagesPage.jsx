import { useMemo } from 'react';
import pagesTemplate from '../../templates/pages.html?raw';
import { extractBodyMarkup } from '../../utils/template';

export default function PagesPage() {
  const bodyMarkup = useMemo(() => extractBodyMarkup(pagesTemplate), []);
  return <div className="page-root" dangerouslySetInnerHTML={{ __html: bodyMarkup }} />;
}
