import type { Metadata } from "next";
import {
  ContactEmail,
  LegalLink,
  LegalPage,
  LegalSection,
} from "@/components/legal-page";
import { siteOperator } from "@/data/legal";
import { templatesStorageKey } from "@/features/chat/ui/personal-templates";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/privacy",
  title: "Privacy policy",
  description:
    "What ArcheLab collects: nothing. No accounts, no cookies, no tracking; saved templates stay in your browser.",
});

// NEXON's API terms §8.6 require this policy: it must say what user data the site
// collects and that NEXON's game data is provided as is (ADR 0021).
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="ArcheLab doesn't ask who you are. It has no accounts, no cookies, no analytics, no ads and no tracking, and it collects no personal data. Your saved templates stay in your own browser."
    >
      <LegalSection title="Who is responsible">
        <p>
          ArcheLab is run by {siteOperator}. Questions about privacy:{" "}
          <ContactEmail />. More in the{" "}
          <LegalLink href="/legal">legal notice</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="What stays on your device">
        <ul>
          <li>
            <strong className="text-foreground">Personal templates.</strong>{" "}
            When you save a template in the chat builder, its name and message
            are stored in your browser&apos;s local storage (under{" "}
            <code className="font-mono text-sm">{templatesStorageKey}</code>).
            They never leave your device. Delete them in the Templates panel, or
            by clearing this site&apos;s data in your browser.
          </li>
          <li>
            <strong className="text-foreground">Share links.</strong> A shared
            message lives in the link itself, after the # sign. Browsers never
            send that part to a server, so ArcheLab never receives it. Anyone
            you give the link to can read the message.
          </li>
          <li>
            <strong className="text-foreground">Copy and paste.</strong> Copy
            puts markup on your clipboard only when you press it. Text you paste
            into the builder stays on the page.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="What other services receive">
        <ul>
          <li>
            <strong className="text-foreground">Delivering the site.</strong>{" "}
            Like any website, the servers that deliver ArcheLab receive
            technical details of each request, such as your IP address, your
            browser and the page you asked for, to deliver the site and protect
            it from abuse. ArcheLab does not use these details to identify or
            track anyone.
          </li>
          <li>
            <strong className="text-foreground">NEXON&apos;s images.</strong>{" "}
            Descendant portraits, weapon images and some icons load straight
            from NEXON&apos;s servers (open.api.nexon.com, and an image host
            NEXON&apos;s website uses). Your browser makes those requests, so
            NEXON receives your IP address and browser details under its own
            privacy policy.
          </li>
          <li>
            <strong className="text-foreground">Other sites.</strong> Links to
            other sites, such as NEXON&apos;s, lead to their own privacy
            policies.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="NEXON game data">
        <p>
          ArcheLab uses NEXON&apos;s public game data, such as Descendants,
          weapons and their images, from the NEXON Open API. It never looks up
          players or accounts, and never asks for your NEXON login. The data is
          fetched when the site is built, refreshed every week and kept no
          longer than 30 days.
        </p>
        <p>
          NEXON game data is provided as is. Neither NEXON nor ArcheLab promises
          that it is complete, accurate or available.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          ArcheLab keeps no personal data, so there is nothing for it to show
          you, correct or delete. Your templates sit in your browser, under your
          control. For what NEXON holds about requests to its servers, contact
          NEXON. Anything else: <ContactEmail />.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          ArcheLab collects no personal data from anyone, children included.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          If this policy changes, the date at the top changes with it. If
          ArcheLab ever starts collecting data, this policy will say so first.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
