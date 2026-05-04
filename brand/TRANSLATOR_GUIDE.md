# LitRoute Translator Guide

This guide helps you understand the brand's voice and tone so your translations feel like LitRoute wrote them — not like a phrase was mechanically swapped into another language.

You'll do all translation work through **Weblate**. You don't need to touch `.po` files or run any commands — Weblate handles that. For the underlying technical workflow, see [`locale/README.md`](../locale/README.md).

---

## What LitRoute Is

LitRoute tracks physical lighters as they pass between strangers. Someone lights a candle at a hostel in Lisbon, hands the lighter to a traveller, and says "check out the website." That traveller sees where it's been. They leave a note. They pass it on.

It was made by one person, for fun, and it shows — in the best way.

> **Brand promise:** _Every lighter has a story. We help you find yours._

---

## Voice in Four Traits

### Precise

UI copy earns every word. Labels, buttons, and error messages should be short and unambiguous. Precision does not mean cold.

- **Do:** "Check in" / "Subscribe" / "This lighter hasn't moved yet."
- **Don't:** "Click here to add your current location data to this unit's history."

### Warm

Genuine care, not performance. We want the note to reach the right person. We're not a startup reciting "we care deeply about our community."

- **Do:** "This lighter's just getting started. Write the first chapter."
- **Don't:** "Welcome to our platform! We're excited to have you here!"

### Playful

The humor comes from earnestness, not from trying to be funny. Being weird about a lighter is the correct response here. The silliness is the whole point.

- **Do:** "The world's slowest social network."
- **Don't:** LOL-speak, exclamation-point spam, forced puns.

### Honest

One person made this for fun. Open source. No tracking. We don't oversell. We don't use the word "platform" unless it earns it.

- **Do:** "I made a thing. It's silly. It's also kind of wonderful?"
- **Don't:** "Our cutting-edge social discovery platform leverages..."

---

## UI Copy vs. Prose

LitRoute has two registers and they're deliberately different.

| Context                         | Register                      | Examples                                    |
| ------------------------------- | ----------------------------- | ------------------------------------------- |
| Buttons, labels, nav, errors    | Short, direct, no personality | "Check in", "Subscribe", "Not found"        |
| Empty states, onboarding, about | Warm, playful, first-person   | "This lighter's just getting started."      |
| Social / external copy          | Casual, lowercase, self-aware | "this website is very silly and I love it." |

Match the register, not just the words. A button label that reads like a short story is wrong. An empty state that sounds like a terms-of-service notice is also wrong.

---

## Terminology to Keep in English

These terms are part of the product identity. Do not translate them — add them to the **Weblate Glossary** for your language so Weblate flags them automatically:

| Term         | Why                                                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **LitRoute** | Brand name. Never translated, never lowercased mid-sentence.                                                                              |
| **Unit**     | The in-app word for a tracked lighter. It's intentionally generic (not every "unit" is a lighter). Keep it.                               |
| **Check in** | The action of logging a unit's location. Translate the verb form only if your language has a clear equivalent that preserves the brevity. |

To add a term to the Glossary in Weblate: open any string that contains the term → click the term in the **Glossary** sidebar → **Add term**. Mark it as "Do not translate" where appropriate.

If your language makes "Unit" feel confusing or clinical, post a comment on one of the affected strings — don't invent a local term without a conversation first.

---

## Taglines and Slogans

Most taglines rely on wordplay that doesn't survive direct translation. **Do not translate taglines literally.** Instead, aim for the emotional effect.

| English                               | Effect to preserve                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| _Pass it on._                         | Double meaning: hand the lighter forward + continue the story. Short and timeless. |
| _Follow the flame._                   | Evocative, not literal. Not instructions — an invitation.                          |
| _The world's slowest social network._ | Self-aware joke. Land the laugh, not the words.                                    |
| _Your lighter's been places._         | Personal, intriguing, slightly conspiratorial.                                     |
| _Light travels far._                  | Minimalist. Both factual and metaphorical.                                         |

If a tagline can't be made to work in your language, use **"Needs editing"** in Weblate and leave a comment on the string explaining why, and suggest an alternative that captures the feel.

---

## Humor and Tone Notes

- **Lowercase is intentional in casual copy.** Social posts and informal UI notes often skip capitalisation on purpose. Follow the source register in your translation.
- **Sentence fragments are fine.** "This lighter's just getting started." is a complete thought, not a typo.
- **Self-deprecation is part of the brand.** "One person made this for fun" is not false modesty — it's the actual story. Honor it.
- **Avoid sounding corporate.** If a translation sounds like it came from a product manager, rewrite it.

---

## Writing Principles (adapted for translators)

These come from the original brand brief and apply to translations too:

1. In UI copy, one word beats three. In storytelling, take your time.
2. The lighter is the hero. Not the app.
3. Never sound like a startup. This was made by one person who made a cool thing.
4. Privacy is a value, not a feature. Live it; don't brag about it.
5. Write notes like you are leaving them for a friend you have not met yet.

---

## Reference Examples

These are approved English examples from the brand brief. Use them to calibrate tone.

**Homepage hero:**

> Your lighter's been places. Find out where.

**About page opener:**

> I'm funemployed and I had a lighter. Someone had given it to me. I wondered where it had been before that. So I made a thing. It's silly. It's also kind of wonderful? You be the judge. — Jonas

**Empty state (no check-ins):**

> This lighter's just getting started. Check in to write the first chapter.

**Social post (casual, user-generated tone):**

> found a lighter at a bar in Lisbon. apparently it's been to 4 countries. left a note for whoever picks it up next. this website is very silly and I love it. litroute.com

---

## Working in Weblate

A few conventions to keep things tidy:

- **Unsure about a string?** Mark it **"Needs editing"** (the pencil icon) rather than leaving a placeholder. This flags it for review without blocking the build.
- **Leaving a note for context?** Use the **Comments** tab on the string — visible to all translators and reviewers. Prefer this over translator notes embedded in the translation itself.
- **Found a source string that's ambiguous or wrong?** Post a comment and tag it as a **"Source string issue"** — that routes it back to Jonas rather than being a translation problem.
- **Translation memory:** Weblate will suggest matches from previously translated strings. Accept them when the context is truly identical, but always sanity-check tone — a button label suggestion might not fit an empty-state sentence even if the words match.
- **Checks:** Weblate runs automatic checks (punctuation, placeholders, line breaks). Don't ignore red checks — they usually catch real problems. Yellow warnings on tone strings are sometimes intentional (e.g. missing full stop in a casual fragment) — use your judgment and leave a comment if you're overriding one.

The goal is a translation that sounds like a warm, slightly-weird person wrote it — not a translation that sounds translated.
