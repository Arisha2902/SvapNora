import { Helmet } from 'react-helmet-async';

import Contact from '../../components/sections/Contact.jsx';

export default function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Contact · SvapNora</title>
        <meta
          name="description"
          content="Start a conversation with the SvapNora engineering team in Prayagraj."
        />
      </Helmet>

      <Contact isPage />
    </>
  );
}
