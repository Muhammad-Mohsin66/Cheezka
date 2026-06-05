import { useMemo } from 'react';
import homeTemplate from '../../templates/index.html?raw';
import { extractBodyMarkup } from '../../utils/template';

export default function HomePage() {
  const bodyMarkup = useMemo(() => extractBodyMarkup(homeTemplate), []);
  return <div className="page-root" dangerouslySetInnerHTML={{ __html: bodyMarkup }} />;
}
