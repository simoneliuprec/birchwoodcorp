import { useRouter } from 'next/router';

const LanguageSwitcher: React.FC = () => {
  const router = useRouter();
  const { locale, locales, asPath } = router;

  return (
    <div style={{ marginBottom: 16 }}>
      {locales?.map((lng) => (
        <button
          key={lng}
          onClick={() => router.push(asPath, asPath, { locale: lng })}
          disabled={locale === lng}
          style={{
            margin: '0 5px',
            fontWeight: locale === lng ? 'bold' : 'normal',
            opacity: locale === lng ? 0.6 : 1,
            cursor: locale === lng ? 'default' : 'pointer'
          }}
        >
          {lng === 'en' ? 'English' : '中文'}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;