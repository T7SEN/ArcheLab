import type { Metadata } from "next";
import {
  ContactEmail,
  LegalLink,
  LegalPage,
  LegalSection,
} from "@/components/legal-page";
import { siteOperator } from "@/data/legal";
import { pageMetadata, siteUrl } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/legal",
  title: "Legal notice",
  description:
    "Who runs ArcheLab, how to reach them, and how ArcheLab relates to NEXON.",
});

export default function LegalNoticePage() {
  return (
    <LegalPage
      title="Legal notice"
      intro={`ArcheLab is a free, unofficial fan site for The First Descendant, run by ${siteOperator}.`}
    >
      <LegalSection title="Who runs ArcheLab">
        <p>
          ArcheLab ({new URL(siteUrl).host}) is run by {siteOperator} as a free,
          non-commercial fan project. It has no ads, no paid features and no
          sponsors.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Email <ContactEmail /> with questions about this site, its data or
          these pages.
        </p>
      </LegalSection>

      <LegalSection title="Not affiliated with NEXON">
        <p>
          ArcheLab is not affiliated with, endorsed by or sponsored by NEXON.
          The First Descendant and its names, images and game data belong to
          NEXON and its licensors.
        </p>
        <p>
          Game data and images come from the{" "}
          <LegalLink href="https://openapi.nexon.com/">
            NEXON Open API
          </LegalLink>{" "}
          and the image hosts of NEXON&apos;s own website. ArcheLab shows them
          as NEXON serves them. Data based on NEXON Open API.
        </p>
      </LegalSection>

      <LegalSection title="Links to other sites">
        <p>
          ArcheLab links to sites it does not control, such as NEXON&apos;s.
          Their owners are responsible for what those sites show.
        </p>
      </LegalSection>

      <LegalSection title="More">
        <p>
          How ArcheLab handles data:{" "}
          <LegalLink href="/privacy">privacy policy</LegalLink>. The rules for
          using it: <LegalLink href="/terms">terms of use</LegalLink>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
