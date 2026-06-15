import { useMemo } from 'react';
import homeTemplate from '../templates/index.html?raw';
import { extractBodyMarkup } from '../utils/template';
import { useHomePage } from '../hooks/pageHooks';

export default function HomePage() {
  useHomePage();
  const bodyMarkup = useMemo(() => extractBodyMarkup(homeTemplate), []);
  return <div className="page-root" dangerouslySetInnerHTML={{ __html: bodyMarkup }} />;
}

