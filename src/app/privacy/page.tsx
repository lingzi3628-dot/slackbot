import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — SPYRO V1",
  description:
    "How the SPYRO V1 mobile app and web app handle your data. Short, plain English, no surprises.",
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 py-12 text-foreground">
      <header className="mb-8">
        <p className="text-sm font-medium text-primary">SPYRO V1</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {new Date().getFullYear()}
        </p>
      </header>

      <div className="space-y-6 text-[15px] leading-relaxed text-foreground/90">
        <section>
          <h2 className="mb-2 text-xl font-semibold">The short version</h2>
          <p>
            SPYRO V1 is a dragon-powered AI chat assistant. Your conversations
            are stored <strong>on your device</strong> — not on our servers.
            When you send a message, only that message (and the recent
            conversation history needed for context) is sent to our backend to
            generate a reply. We don&apos;t sell your data, we don&apos;t show
            ads, and we don&apos;t have user accounts.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">What we collect</h2>
          <p className="mb-3">Almost nothing. Specifically:</p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>
              <strong>Your prompts.</strong> When you send a message, it&apos;s
              transmitted to our backend ({`https://<this-domain>/api/chat`}) and
              forwarded to our AI text provider to generate a response. We do
              not store your prompts server-side.
            </li>
            <li>
              <strong>Push token.</strong> If you enable notifications, we
              register a device token so we can send you a local notification
              when a backgrounded response finishes. The token is not linked to
              any personal identity.
            </li>
            <li>
              <strong>Crash reports.</strong> If we enable Sentry in a future
              build, anonymized crash data may be sent to help us fix bugs.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">What we don&apos;t collect</h2>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>No account, email, name, or profile information.</li>
            <li>No location data.</li>
            <li>No advertising identifiers.</li>
            <li>
              No biometric data — Face ID / Touch ID is handled entirely by
              your device&apos;s OS and never leaves it.
            </li>
            <li>No analytics or tracking (unless you opt in to a future optional analytics prompt).</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Where your data lives</h2>
          <p>
            Your conversation history is stored locally on your device using
            encrypted on-device storage (MMKV on mobile, localStorage on web).
            Uninstalling the app deletes all conversations. You can also clear
            everything from <em>Settings → Clear all conversations</em>, or
            export it to a file from <em>Settings → Export all conversations</em>.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Third-party services</h2>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>
              <strong>AI text provider.</strong> Prompts are forwarded to a
              third-party AI text API to generate replies. That provider may
              log requests per their own privacy policy. We send a{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">private</code>{" "}
              flag with each request to ask them not to use the content for
              training.
            </li>
            <li>
              <strong>Expo / EAS.</strong> Used for app updates and (optionally)
              push notifications. See{" "}
              <a
                className="text-primary underline underline-offset-2"
                href="https://expo.dev/privacy"
                target="_blank"
                rel="noreferrer noopener"
              >
                Expo&apos;s privacy policy
              </a>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Children&apos;s privacy</h2>
          <p>
            SPYRO V1 is rated 17+ and is not directed at children under 17. We
            do not knowingly collect data from children. If you believe a minor
            has used the app, contact us and we&apos;ll delete any relevant data.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Your rights</h2>
          <p>
            Because we don&apos;t keep your data on our servers, most &quot;right
            to be forgotten&quot; requests are satisfied by simply uninstalling
            the app or tapping <em>Clear all conversations</em>. For anything
            else, contact us at the address below.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Changes to this policy</h2>
          <p>
            If we change how the app handles data, we&apos;ll update this page
            and bump the &quot;last updated&quot; date. Material changes will
            also be announced in the app&apos;s release notes.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Contact</h2>
          <p>
            Questions or data requests? Open an issue at{" "}
            <a
              className="text-primary underline underline-offset-2"
              href="https://github.com/meshmusic2836-lab/slackbot/issues"
              target="_blank"
              rel="noreferrer noopener"
            >
              github.com/meshmusic2836-lab/slackbot/issues
            </a>
            .
          </p>
        </section>
      </div>

      <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
        Built with fire by SPYRO Labs. 🐉🔥
      </footer>
    </article>
  );
}
