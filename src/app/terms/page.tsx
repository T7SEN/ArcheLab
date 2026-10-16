import type { Metadata } from "next";
import {
  ContactEmail,
  LegalLink,
  LegalPage,
  LegalSection,
} from "@/components/legal-page";
import { siteOperator } from "@/data/legal";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/terms",
  title: "Terms of use",
  description:
    "The rules for using ArcheLab, a free, unofficial fan site for The First Descendant.",
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      intro="By using ArcheLab you agree to these terms. If you don't, please don't use the site."
    >
      <LegalSection title="What ArcheLab is">
        <p>
          ArcheLab is a free, unofficial fan site with tools for The First
          Descendant, run by {siteOperator}. It is not affiliated with, endorsed
          by or sponsored by NEXON.
        </p>
      </LegalSection>

      <LegalSection title="Game data">
        <p>
          Game data and images come from the NEXON Open API and belong to NEXON
          and its licensors. They are provided as is, and may be incomplete, out
          of date or unavailable.
        </p>
        <p>
          Chat tags were tested in the game, but a game update can change how a
          message looks. ArcheLab can&apos;t promise the game shows a message
          exactly as the preview does.
        </p>
      </LegalSection>

      <LegalSection title="Your messages">
        <p>
          You&apos;re responsible for the messages you build, save, share and
          post. Follow The First Descendant&apos;s rules and NEXON&apos;s terms
          when you post them in the game. Anyone you send a share link to can
          read its message.
        </p>
      </LegalSection>

      <LegalSection title="Using the site fairly">
        <p>
          Don&apos;t try to break, overload or misuse the site, or use it to
          harm others. Automated use that puts a heavy load on the site
          isn&apos;t allowed.
        </p>
      </LegalSection>

      <LegalSection title="ArcheLab's content">
        <p>
          ArcheLab&apos;s design, text and code are {siteOperator}&apos;s. Parts
          made by others, such as the fonts and some interface components, keep
          their own licenses. NEXON&apos;s names, images and data stay
          NEXON&apos;s.
        </p>
      </LegalSection>

      <LegalSection title="No warranty">
        <p>
          ArcheLab is provided as is and as available, without warranties of any
          kind. It may change, pause or close at any time without notice.
        </p>
      </LegalSection>

      <LegalSection title="Liability">
        <p>
          As far as the law allows, {siteOperator} is not liable for any loss or
          damage from using ArcheLab, such as lost templates or anything that
          happens in the game.
        </p>
      </LegalSection>

      <LegalSection title="Other sites">
        <p>
          Links to other sites, such as NEXON&apos;s, are there for convenience.
          Those sites&apos; own terms apply.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          These terms may change; the date at the top shows the current version.
          Using the site after a change means you accept it.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these terms: <ContactEmail />. See also the{" "}
          <LegalLink href="/privacy">privacy policy</LegalLink> and the{" "}
          <LegalLink href="/legal">legal notice</LegalLink>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
