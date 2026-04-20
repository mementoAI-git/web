/**
 * Short public-domain excerpts for voice previews — natural read-aloud, not app copy.
 */
export const VOICE_PREVIEW_PASSAGES: readonly string[] = [
  `It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.`,
  `Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.`,
  `It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair.`,
  `Marley was dead: to begin with. There is no doubt whatever about that. The register of his burial was signed by the clergyman, the clerk, the undertaker, and the chief mourner. Scrooge signed it: and Scrooge's name was good upon Change, for anything he chose to put his hand to.`,
  `Mrs. Rachel Lynde lived just where the Avonlea main road dipped down into a little hollow, fringed with alders and ladies' eardrops and traversed by a brook that had its source away back in the woods of the old Cuthbert place; it was reputed to be an intricate, headlong brook in its earlier course, but a very mild and respectable brook after it reached Lynde's Hollow.`,
  `To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler.`,
  `All happy families are alike; each unhappy family is unhappy in its own way.`,
  `It is a far, far better thing that I do, than I have ever done; it is a far, far better rest that I go to than I have ever known.`,
  `I am no bird; and no net ensnares me: I am a free human being with an independent will, which I now exert to leave you.`,
  `There was no possibility of taking a walk that day. We had been wandering, indeed, in the leafless shrubbery an hour in the morning, but since dinner the cold winter wind had brought with it clouds so sombre, and a rain so penetrating, that further outdoor exercise was now out of the question.`,
  `You don't know about me without you have read a book by the name of The Adventures of Tom Sawyer; but that ain't no matter. That book was made by Mr. Mark Twain, and he told the truth, mainly. There was things which he stretched, but mainly he told the truth.`,
  `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice, "without pictures or conversations?"`,
  `When shall we three meet again in thunder, lightning, or in rain? When the hurlyburly's done, when the battle's lost and won.`,
  `I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived.`,
  `Among other public buildings in a certain town, which for many reasons it will be prudent to refrain from mentioning, and to which I will assign no fictitious name, there is one anciently common to most towns, great or small: to wit, a workhouse; and in this workhouse was born on a day and date which I need not trouble myself to repeat, inasmuch as it can be of no possible consequence to the reader, in this stage of the business at all events, the item of mortality whose name is prefixed to the head of this chapter.`,
  `True!—nervous—very, very dreadfully nervous I had been and am; but why will you say that I am mad? The disease had sharpened my senses—not destroyed—not dulled them. Above all was the sense of hearing acute.`,
  `Jonathan Harker's Journal. 3 May. Bistritz.—Left Munich at 8:35 P. M., on 1st May, arriving at Vienna early next morning; we should have arrived at 6:46, but the train was an hour late.`,
  `It was the Dover road that lay, on a Friday night late in November, before the first of the persons with whom this history has business. The Dover road lay, as to him, beyond the Dover mail, as it lumbered up Shooter's Hill.`,
];

export function pickRandomVoicePreviewPassage(): string {
  const i = Math.floor(Math.random() * VOICE_PREVIEW_PASSAGES.length);
  return VOICE_PREVIEW_PASSAGES[i] ?? VOICE_PREVIEW_PASSAGES[0];
}
