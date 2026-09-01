type FooterProps = {
  footerText: string;
};

export default function Footer({ footerText }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p>{footerText}</p>
        <p>{year}</p>
      </div>
    </footer>
  );
}
