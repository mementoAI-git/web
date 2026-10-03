# Memento Explore Topics — Concept & Implementation

## 1. Purpose

Explore Topics is a guided reflection system that helps users add meaningful personal context to Memento through questions they can answer at their own pace.

The experience should feel approachable first and increasingly personal over time.

Explore is not a rigid assessment and should not assume that every user has had the same experiences. The system should begin with broad, low-assumption starter questions, then gradually introduce AI-generated personalized questions as Memento learns more about the user.

---

## 2. Core Principle

**Ask about the person before assuming the experience.**

Memento should not begin with questions that presume the user has experienced marriage, heartbreak, loss, parenthood, travel, career success, trauma, religious faith, or any other specific life event.

Instead:

1. Start with safe, broadly answerable questions.
2. Learn from the user's answers and existing Memento context.
3. Gradually generate more specific questions when there is enough evidence that they are relevant.
4. Continue mixing broad questions with personalized questions so Explore never becomes too narrow.

---

## 3. Explore Categories

Explore uses human-friendly categories designed for browsing and reflection.

These categories are separate from the internal Life Areas / Enrichment Areas. A question may contribute to one or more Life Areas regardless of which Explore category it appears under.

| Category | Slug | Scope |
|---|---|---|
| Growing Up | `growing-up` | Childhood, school, early memories, firsts, formative experiences |
| People I Love | `people-i-love` | Family, friendships, romantic relationships, important people |
| The Life I Live | `the-life-i-live` | Routines, home, habits, everyday life, how the user spends their time |
| Things I Love | `things-i-love` | Music, food, hobbies, interests, places, entertainment, personal favorites |
| Who I Am | `who-i-am` | Personality, identity, strengths, fears, quirks, self-perception |
| Work & Purpose | `work-purpose` | Career, ambition, money, contribution, meaningful work, purpose |
| Beliefs & Faith | `beliefs-faith` | Religion, spirituality, values, morality, worldview, meaning, doubt |
| Where I Come From | `where-i-come-from` | Family history, heritage, culture, traditions, community, place |
| Stories & Adventures | `stories-adventures` | Travel, memorable experiences, funny stories, adventures, unusual moments |
| What Life Taught Me | `what-life-taught-me` | Lessons, mistakes, advice, growth, perspective, difficult periods |
| What's Ahead | `whats-ahead` | Hopes, goals, dreams, future experiences, unfinished ambitions |

---

## 4. Starter Question System

Each category begins with **10 curated starter questions**.

Starter questions should:

- be broadly answerable by most users,
- make minimal assumptions about the user's life,
- avoid demanding highly emotional disclosure,
- allow short or detailed answers,
- provide useful context to Memento,
- help determine which deeper topics are relevant later.

This gives the product **110 starter questions** across 11 categories.

Starter questions are bootstrap data for personalization. They are not a checklist the user must finish.

---

## 5. Personalization Threshold

Memento should begin introducing personalized questions after the user has answered approximately **5 starter questions within a category**.

This is a soft threshold, not a visible unlock.

The user should not see messaging such as:

> Complete 5 questions to unlock personalized questions.

Instead, the Explore feed should quietly become more personalized as Memento gathers enough signal.

### Recommended logic

- **0–4 answers in category:** primarily curated starter questions.
- **5+ answers in category:** begin mixing AI-generated personalized questions into the category.
- Continue keeping unanswered starter questions available.
- Increase the share of personalized questions as confidence and context improve.

The exact mix can evolve, but an initial implementation can use:

- **Before threshold:** 100% starter questions.
- **After threshold:** approximately 60% starter / 40% personalized.
- **High-context users:** approximately 30% starter / 70% personalized.

Do not permanently remove starter questions simply because personalization has started.

---

## 6. AI Question Generation

When generating a personalized question, the AI should use relevant context from:

- previous answers in the current Explore category,
- answers from other Explore categories,
- memories and stories,
- Quick Notes,
- relevant Insights / known facts,
- user-provided media context where available,
- questions the user skipped or marked as irrelevant.

The AI should generate questions based on evidence rather than assumptions.

### Example

Starter question:

> What kind of work would make you feel proud of yourself?

If Memento later knows the user is a designer:

> What kind of product would you love to be known for creating?

If the user has also discussed a difficult work environment:

> What did that experience teach you about the kind of environment you work best in?

Each step becomes more specific because the system has evidence supporting the question.

---

## 7. Question Relevance Rules

Personalized questions should follow these rules:

### Do

- Ask about known people, interests, places, goals, or experiences.
- Build naturally from previously shared information.
- Ask reflective follow-ups when there is enough context.
- Allow the user to answer briefly.
- Phrase sensitive questions gently and neutrally.

### Do not

- Invent experiences.
- Assume marriage, children, loss, trauma, religion, travel, career history, or relationships.
- Ask unnecessarily intense questions simply because a topic is technically relevant.
- Repeat questions the user has effectively answered elsewhere.
- Generate near-duplicate questions.
- Treat skipped questions as unanswered invitations to ask again.

---

## 8. Skip / Not Relevant Feedback

Every Explore question should support a lightweight way for the user to indicate that it does not fit them.

Recommended actions:

- `Skip`
- `Not relevant to me`

These actions should influence future question selection.

### Behavior

If a user marks a question as `Not relevant to me`:

- record that feedback,
- avoid resurfacing the same question,
- reduce similar assumption-dependent questions,
- use it as negative context during AI generation.

A normal `Skip` should be weaker feedback and should not necessarily imply that the topic itself is irrelevant.

---

## 9. Question Metadata

Each question should have enough metadata for selection, filtering, and future personalization.

Recommended structure:

```ts
type ExploreQuestion = {
  id: string
  categorySlug: ExploreCategorySlug
  question: string
  source: "starter" | "ai-generated"
  status?: "unanswered" | "answered" | "skipped" | "not-relevant"
  createdAt?: string
}
```

For AI-generated questions, also store the generation context or references needed for auditing/debugging without exposing internal reasoning to the user.

Optional future metadata:

```ts
depth?: "light" | "reflective" | "deep"
tags?: string[]
```

Tags may include themes such as:

```txt
travel
childhood
friendship
career
faith
money
loss
change
family
identity
health
firsts
regret
joy
```

Tags should support personalization and search but do not need to be visible to the user.

---

## 10. Category Progress

The system may internally track how many starter questions the user has answered per category.

Example:

```ts
{
  categorySlug: "growing-up",
  starterAnswered: 6,
  starterTotal: 10,
  personalizedQuestionsEnabled: true
}
```

Do not make the user feel required to complete a category.

Explore should feel like browsing prompts, not completing homework.

---

## 11. Feed / Question Selection

When the user opens a category:

1. Fetch unanswered starter questions.
2. Check whether the category has enough user context for personalization.
3. If below threshold, prioritize starter questions.
4. If above threshold, mix starter and personalized questions.
5. Exclude questions already answered or marked not relevant.
6. Avoid highly similar questions.
7. Favor questions that add genuinely new context.

The AI should only generate more questions when the available personalized pool is running low or when new user context creates a meaningful new direction.

Do not generate large numbers of AI questions unnecessarily.

---

## 12. Relationship to Enrichment

Explore categories are a **user-facing discovery structure**.

They should not replace Memento's Life Areas / Enrichment Areas.

A single Explore answer may enrich multiple Life Areas.

For example:

> What trip changed how you see the world?

Visible Explore category:

`stories-adventures`

Possible internal enrichment relevance:

- Memories & Experiences
- Beliefs & Worldview
- Identity & Self

The user does not need to see this mapping.

---

## 13. Migration From Current Categories

Current Explore category slugs:

```txt
career
family
relationship
region
belief
purpose
life-transition
wellbeing
identity
experience-culture
```

The new taxonomy should become the user-facing Explore structure.

Do not blindly rename existing database values if those slugs are already referenced elsewhere.

Recommended migration approach:

1. Add the new category definitions.
2. Map existing questions into the new categories.
3. Preserve old slugs temporarily if required for backward compatibility.
4. Update references in the UI/API.
5. Migrate stored question/category relationships.
6. Remove deprecated slugs only after confirming nothing depends on them.

The existing `region` slug should be reviewed separately because it currently appears to represent faith/religious content and may be a legacy naming issue.

---

## 14. Product Experience Goal

Explore should evolve from:

**"Here are some good questions anyone can answer."**

into:

**"Memento knows enough about me to ask questions that actually feel relevant."**

The transition should happen gradually and invisibly.

The user should never feel that Memento is interviewing them, testing them, or making assumptions about their life.
