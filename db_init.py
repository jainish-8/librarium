"""
db_init.py — Librarium Dataset Generator
Generates: 100+ books, 20+ authors, sample users, empty transactions
Run: python db_init.py
"""

import json
import os
import random
from datetime import datetime, timedelta
import hashlib

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────
# UTILITY
# ─────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def atomic_write(path: str, data) -> None:
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)
    os.replace(tmp, path)

# ─────────────────────────────────────────────────────────
# AUTHORS (20 unique authors)
# ─────────────────────────────────────────────────────────
AUTHORS = [
    {
        "id": "auth_001",
        "name": "George Orwell",
        "nationality": "British",
        "birth_year": 1903,
        "death_year": 1950,
        "genre": "Dystopian / Classic",
        "bio": "Eric Arthur Blair, known by his pen name George Orwell, was an English novelist, essayist, journalist, and critic. His work is characterised by lucid prose, social criticism, opposition to totalitarianism, and support of democratic socialism. Orwell wrote literary criticism, poetry, fiction, and polemical journalism. Best known for the allegorical novella Animal Farm and the dystopian novel Nineteen Eighty-Four.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=george_orwell&backgroundColor=b6e3f4",
        "book_count": 0,
        "website": "https://orwellfoundation.com"
    },
    {
        "id": "auth_002",
        "name": "Frank Herbert",
        "nationality": "American",
        "birth_year": 1920,
        "death_year": 1986,
        "genre": "Science Fiction",
        "bio": "Franklin Patrick Herbert Jr. was an American science fiction author best known for the 1965 novel Dune and its five sequels. Though he became famous for science fiction, Herbert was also a short story writer, newspaper journalist, photographer, book reviewer, ecological consultant, and lecturer. The Dune series is frequently cited as the best-selling science fiction series in history.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=frank_herbert&backgroundColor=c0aede",
        "book_count": 0,
        "website": "https://dunenovels.com"
    },
    {
        "id": "auth_003",
        "name": "Haruki Murakami",
        "nationality": "Japanese",
        "birth_year": 1949,
        "death_year": None,
        "genre": "Contemporary / Magical Realism",
        "bio": "Haruki Murakami is a Japanese novelist. His novels, essays and short stories have been bestsellers in Japan as well as internationally, with his work translated into 50 languages and selling millions of copies outside Japan. His works of fiction and non-fiction have garnered critical acclaim and numerous awards, including the Kafka Prize, the Frank O'Connor International Short Story Award, and the Jerusalem Prize.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=haruki_murakami&backgroundColor=d1d4f9",
        "book_count": 0,
        "website": "https://www.harukimurakami.com"
    },
    {
        "id": "auth_004",
        "name": "Toni Morrison",
        "nationality": "American",
        "birth_year": 1931,
        "death_year": 2019,
        "genre": "Literary Fiction / Classic",
        "bio": "Chloe Anthony Wofford Morrison, known as Toni Morrison, was an American novelist, essayist, book editor, and college professor. Her first novel, The Bluest Eye, was published in 1970. The critically acclaimed Song of Solomon brought her national attention and won the National Book Critics Circle Award. In 1988, Morrison won the Pulitzer Prize for Beloved, and was awarded the Nobel Prize in Literature in 1993.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=toni_morrison&backgroundColor=ffd5dc",
        "book_count": 0,
        "website": ""
    },
    {
        "id": "auth_005",
        "name": "Yuval Noah Harari",
        "nationality": "Israeli",
        "birth_year": 1976,
        "death_year": None,
        "genre": "History / Philosophy",
        "bio": "Yuval Noah Harari is an Israeli public intellectual, historian and a professor in the Department of History at the Hebrew University of Jerusalem. He is the author of the popular science bestsellers Sapiens: A Brief History of Humankind, Homo Deus: A Brief History of Tomorrow, and 21 Lessons for the 21st Century. His books have sold 45 million copies worldwide and have been translated into 65 languages.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=yuval_harari&backgroundColor=b6e3f4",
        "book_count": 0,
        "website": "https://www.ynharari.com"
    },
    {
        "id": "auth_006",
        "name": "Agatha Christie",
        "nationality": "British",
        "birth_year": 1890,
        "death_year": 1976,
        "genre": "Mystery / Thriller",
        "bio": "Dame Agatha Mary Clarissa Christie, Lady Mallowan, was an English writer known for her 66 detective novels and 14 short story collections, particularly those revolving around fictional detectives Hercule Poirot and Miss Marple. She also wrote the world's longest-running play, The Mousetrap, and six romances under the pen name Mary Westmacott. According to Guinness World Records, Christie is the best-selling fiction writer of all time.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=agatha_christie&backgroundColor=c0aede",
        "book_count": 0,
        "website": "https://www.agathachristie.com"
    },
    {
        "id": "auth_007",
        "name": "Marcus Aurelius",
        "nationality": "Roman",
        "birth_year": 121,
        "death_year": 180,
        "genre": "Philosophy / Stoicism",
        "bio": "Marcus Aurelius was Roman emperor from 161 to 180 AD and a Stoic philosopher. He was the last of the rulers known as the Five Good Emperors. His Meditations, written in Koine Greek as a source for his own guidance and self-improvement, is still revered as a literary monument to a philosophy of service and duty and still remains relevant today. They are considered one of the greatest works of philosophy.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=marcus_aurelius&backgroundColor=d1d4f9",
        "book_count": 0,
        "website": ""
    },
    {
        "id": "auth_008",
        "name": "James Clear",
        "nationality": "American",
        "birth_year": 1986,
        "death_year": None,
        "genre": "Self-Help / Productivity",
        "bio": "James Clear is an author, entrepreneur, and speaker focused on habits, decision making, and continuous improvement. He is the author of Atomic Habits, one of the most popular books of the past decade. His work draws on biology, psychology, and neuroscience to explain why humans behave the way they do and how we can develop better habits. His writing has appeared in the New York Times and Time magazine.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=james_clear&backgroundColor=ffd5dc",
        "book_count": 0,
        "website": "https://jamesclear.com"
    },
    {
        "id": "auth_009",
        "name": "J.R.R. Tolkien",
        "nationality": "British",
        "birth_year": 1892,
        "death_year": 1973,
        "genre": "Fantasy / Mythology",
        "bio": "John Ronald Reuel Tolkien was an English writer and philologist. He was the author of the high fantasy works The Hobbit and The Lord of the Rings. From 1925 to 1945, Tolkien was the Rawlinson and Bosworth Professor of Anglo-Saxon and a Fellow of Pembroke College, Oxford. He is often credited as the father of modern high fantasy literature. Time magazine named him one of its 100 Most Important People of the century.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=tolkien&backgroundColor=b6e3f4",
        "book_count": 0,
        "website": "https://www.tolkienestate.com"
    },
    {
        "id": "auth_010",
        "name": "Michelle Obama",
        "nationality": "American",
        "birth_year": 1964,
        "death_year": None,
        "genre": "Biography / Memoir",
        "bio": "Michelle LaVaughn Robinson Obama is an American attorney and author who served as the first lady of the United States from 2009 to 2017. She is the wife of the 44th president, Barack Obama. Raised on the South Side of Chicago, Illinois, she is a graduate of Princeton University and Harvard Law School. Her memoir Becoming is one of the most personal and inspiring books of her generation.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=michelle_obama&backgroundColor=c0aede",
        "book_count": 0,
        "website": "https://michelleobama.com"
    },
    {
        "id": "auth_011",
        "name": "Douglas Adams",
        "nationality": "British",
        "birth_year": 1952,
        "death_year": 2001,
        "genre": "Science Fiction / Comedy",
        "bio": "Douglas Noel Adams was an English author, screenwriter, essayist, humorist, satirist and dramatist. Adams was author of The Hitchhiker's Guide to the Galaxy, which originated in 1978 as a BBC Radio 4 comedy, before developing into a 'trilogy of five books' that sold more than 15 million copies in his lifetime. He is a prominent figure in the comedy-science fiction genre and is widely regarded as one of the most creative minds in British popular culture.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=douglas_adams&backgroundColor=d1d4f9",
        "book_count": 0,
        "website": ""
    },
    {
        "id": "auth_012",
        "name": "Viktor Frankl",
        "nationality": "Austrian",
        "birth_year": 1905,
        "death_year": 1997,
        "genre": "Philosophy / Psychology",
        "bio": "Viktor Emil Frankl was an Austrian psychiatrist, psychotherapist, philosopher, author, and Holocaust survivor. He was the founder of logotherapy, a school of psychotherapy which describes a search for a life's meaning as the central human motivational force. Frankl was one of the key figures in existential therapy and a prominent source of inspiration for humanistic psychologists. His book Man's Search for Meaning is considered one of the ten most influential books in the United States.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=viktor_frankl&backgroundColor=ffd5dc",
        "book_count": 0,
        "website": ""
    },
    {
        "id": "auth_013",
        "name": "Fyodor Dostoevsky",
        "nationality": "Russian",
        "birth_year": 1821,
        "death_year": 1881,
        "genre": "Classic / Literary Fiction",
        "bio": "Fyodor Mikhailovich Dostoevsky was a Russian novelist, short story writer, essayist and journalist. His literary works explore human psychology in the troubled political, social, and spiritual atmospheres of 19th-century Russia, and engage with a variety of philosophical and religious themes. He is regarded as one of the greatest writers in the history of literature. Time magazine named him one of the 10 greatest writers of all time.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=dostoevsky&backgroundColor=b6e3f4",
        "book_count": 0,
        "website": ""
    },
    {
        "id": "auth_014",
        "name": "Chimamanda Ngozi Adichie",
        "nationality": "Nigerian",
        "birth_year": 1977,
        "death_year": None,
        "genre": "Contemporary / Feminism",
        "bio": "Chimamanda Ngozi Adichie is a Nigerian author. Her works range from novels to short stories to nonfiction. Adichie grew up in Nigeria and first came to prominence with her novel Purple Hibiscus in 2003. Her 2006 novel Half of a Yellow Sun was awarded the Orange Prize. Adichie has won numerous awards and was named one of Time magazine's 100 Most Influential People in the World.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=adichie&backgroundColor=c0aede",
        "book_count": 0,
        "website": "https://chimamanda.com"
    },
    {
        "id": "auth_015",
        "name": "Stephen Hawking",
        "nationality": "British",
        "birth_year": 1942,
        "death_year": 2018,
        "genre": "Science / History",
        "bio": "Stephen William Hawking was an English theoretical physicist, cosmologist, and author who, at the time of his death, was director of research at the Centre for Theoretical Cosmology at the University of Cambridge. Between 1979 and 2009, he was the Lucasian Professor of Mathematics at Cambridge, widely viewed as one of the most prestigious academic posts in the world. His book A Brief History of Time appeared on the Sunday Times bestseller list for a record-breaking 237 weeks.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=hawking&backgroundColor=d1d4f9",
        "book_count": 0,
        "website": "https://www.hawking.org.uk"
    },
    {
        "id": "auth_016",
        "name": "Gillian Flynn",
        "nationality": "American",
        "birth_year": 1971,
        "death_year": None,
        "genre": "Mystery / Psychological Thriller",
        "bio": "Gillian Flynn is an American author and former television critic for Entertainment Weekly. She is best known for her mystery and suspense novels, including Sharp Objects, Dark Places, and Gone Girl, which was adapted into a 2014 film by David Fincher. Her work is dark, literary, and unflinching in its portrayal of violence and psychological manipulation, earning her comparisons to Patricia Highsmith and Daphne du Maurier.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=gillian_flynn&backgroundColor=ffd5dc",
        "book_count": 0,
        "website": "https://gillianflynn.com"
    },
    {
        "id": "auth_017",
        "name": "Paulo Coelho",
        "nationality": "Brazilian",
        "birth_year": 1947,
        "death_year": None,
        "genre": "Fiction / Spiritual",
        "bio": "Paulo Coelho de Souza is a Brazilian lyricist and novelist and member of the Brazilian Academy of Letters since 2002. He is one of the most widely read authors in the world, with The Alchemist being among the best-selling books in history, having sold over 65 million copies worldwide and being translated into 88 languages. His novels often focus on self-discovery, spiritual journeys, and the pursuit of personal legends.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=paulo_coelho&backgroundColor=b6e3f4",
        "book_count": 0,
        "website": "https://paulocoelho.com"
    },
    {
        "id": "auth_018",
        "name": "Malcolm Gladwell",
        "nationality": "Canadian-British",
        "birth_year": 1963,
        "death_year": None,
        "genre": "Non-Fiction / Social Science",
        "bio": "Malcolm Timothy Gladwell is a Canadian-English journalist, author, and public speaker. He has been a staff writer for The New Yorker since 1996. He has written six books that were on the New York Times Best Seller list. Gladwell's books often popularize social science research and examine how ideas, trends, and behaviors spread. He has been included in the TIME 100 Most Influential People list and touted as one of Foreign Policy's Top Global Thinkers.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=malcolm_gladwell&backgroundColor=c0aede",
        "book_count": 0,
        "website": "https://www.gladwellbooks.com"
    },
    {
        "id": "auth_019",
        "name": "Kazuo Ishiguro",
        "nationality": "British-Japanese",
        "birth_year": 1954,
        "death_year": None,
        "genre": "Literary Fiction / Historical",
        "bio": "Sir Kazuo Ishiguro OBE FRSA FRSL is a British novelist, screenwriter, musician, and short-story writer. He was born in Nagasaki, Japan, and moved to Britain in 1960 when he was five years old. He is one of the most celebrated contemporary fiction authors in the English-speaking world. He has received four Man Booker Prize nominations and won the award in 1989 for The Remains of the Day. In 2017, he was awarded the Nobel Prize in Literature.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=ishiguro&backgroundColor=d1d4f9",
        "book_count": 0,
        "website": ""
    },
    {
        "id": "auth_020",
        "name": "Brené Brown",
        "nationality": "American",
        "birth_year": 1965,
        "death_year": None,
        "genre": "Self-Help / Psychology",
        "bio": "Cassandra Brené Brown is an American professor, lecturer, author, and podcast host. Brown is known for her research on shame, vulnerability, and leadership. Her books have spent years on the New York Times Best Sellers list. She has given two TEDx talks — one of which is one of the most viewed TED talks in the world, with millions of views. Brown was named one of Fast Company's '50 Most Influential People in Business.'",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=brene_brown&backgroundColor=ffd5dc",
        "book_count": 0,
        "website": "https://brenebrown.com"
    },
    {
        "id": "auth_021",
        "name": "Patrick Rothfuss",
        "nationality": "American",
        "birth_year": 1973,
        "death_year": None,
        "genre": "Fantasy / Epic",
        "bio": "Patrick James Rothfuss is an American author of epic fantasy. He is best known for The Kingkiller Chronicle, his in-progress trilogy. His debut novel, The Name of the Wind, won the Quill Award and was a Publishers Weekly Best Book of the Year. He holds a BA in English and a MA in English Education. Rothfuss is recognized for his intricate storytelling, richly imagined world, and the musical underpinnings of his magic system.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=rothfuss&backgroundColor=b6e3f4",
        "book_count": 0,
        "website": "https://www.patrickrothfuss.com"
    },
    {
        "id": "auth_022",
        "name": "Walter Isaacson",
        "nationality": "American",
        "birth_year": 1952,
        "death_year": None,
        "genre": "Biography / History",
        "bio": "Walter Isaacson is an American author, journalist, and professor. He is a University Professor of History at Tulane University. He has been the chairman and CEO of CNN and the managing editor of Time magazine. He is the author of acclaimed biographies of Albert Einstein, Benjamin Franklin, Henry Kissinger, Steve Jobs, Leonardo da Vinci, and most recently Elon Musk. His books are known for unprecedented access to their subjects and exhaustive research.",
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=isaacson&backgroundColor=c0aede",
        "book_count": 0,
        "website": "https://www.walterisaacson.com"
    },
]

# ─────────────────────────────────────────────────────────
# BOOKS (100+ entries across 10+ categories)
# ─────────────────────────────────────────────────────────

BOOK_TEMPLATES = [
    # ── DYSTOPIAN ──────────────────────────────────────
    {"title": "Nineteen Eighty-Four", "author_id": "auth_001", "category": "Dystopian", "year": 1949, "pages": 328,
     "isbn": "978-0-451-52493-5", "language": "English", "publisher": "Secker & Warburg",
     "description": "In a totalitarian superstate called Oceania, Winston Smith is a low-ranking member of the ruling Party who secretly harbours thoughts of rebellion against Big Brother. Orwell's masterwork of dystopian fiction remains one of the most compelling and chilling visions of what a future under total surveillance and thought-control might look like. The novel coined phrases that have entered everyday language: doublethink, thoughtcrime, and Newspeak.",
     "tags": ["Totalitarianism", "Surveillance", "Classic", "Political"], "rating": 4.8},

    {"title": "Brave New World", "author_id": "auth_001", "category": "Dystopian", "year": 1932, "pages": 311,
     "isbn": "978-0-060-85052-4", "language": "English", "publisher": "Chatto & Windus",
     "description": "In Aldous Huxley's future, the World State conditions citizens into passive consumerism using genetic engineering, psychological conditioning, and a happiness drug called soma. Bernard Marx feels alienated in this 'perfect' world and travels to a Savage Reservation, where he meets John, a man raised on Shakespeare and genuine human emotion. A searing critique of modern consumer culture, scientific hubris, and the cost of comfort.",
     "tags": ["Genetics", "Consumerism", "Control", "Satire"], "rating": 4.5},

    {"title": "The Handmaid's Tale", "author_id": "auth_004", "category": "Dystopian", "year": 1985, "pages": 311,
     "isbn": "978-0-385-49081-8", "language": "English", "publisher": "McClelland and Stewart",
     "description": "Set in the near future in Gilead, a theocratic dictatorship that has replaced the United States, the novel follows Offred—a Handmaid assigned to bear children for the ruling class. Told with unbearable intimacy, Atwood's speculative fiction is both a harrowing dystopia and a deeply personal story of survival, identity, and resistance. Named one of the 100 best English-language novels since 1923 by Time magazine.",
     "tags": ["Feminism", "Religion", "Power", "Survival"], "rating": 4.7},

    {"title": "Fahrenheit 451", "author_id": "auth_011", "category": "Dystopian", "year": 1953, "pages": 256,
     "isbn": "978-1-451-67310-8", "language": "English", "publisher": "Ballantine Books",
     "description": "In a future American society where books are outlawed and firemen burn any that are found, Guy Montag is a fireman who begins to question the culture of ignorance enforced by his government. Bradbury's short, ferocious novel is a burning manifesto about the importance of literature, critical thinking, and intellectual freedom in the face of mass conformity and the dumbing-down of culture through entertainment.",
     "tags": ["Censorship", "Books", "Freedom", "Classic"], "rating": 4.6},

    {"title": "The Road", "author_id": "auth_013", "category": "Dystopian", "year": 2006, "pages": 287,
     "isbn": "978-0-307-26543-2", "language": "English", "publisher": "Alfred A. Knopf",
     "description": "A post-apocalyptic tale of a father and his young son walking alone through burned America. Nothing moves in the ravaged landscape save the ash on the wind. It is cold enough to crack stones, and when the snow falls it is gray. The sky is dark. Their destination is the coast, although they don't know what, if anything, awaits them there. Winner of the Pulitzer Prize and the James Tait Black Memorial Prize.",
     "tags": ["Post-Apocalyptic", "Survival", "Family", "Pulitzer"], "rating": 4.4},

    {"title": "Lord of the Flies", "author_id": "auth_007", "category": "Dystopian", "year": 1954, "pages": 224,
     "isbn": "978-0-399-50148-0", "language": "English", "publisher": "Faber & Faber",
     "description": "A group of British boys stranded on an uninhabited island attempt to govern themselves with disastrous results. As civilization breaks down and savagery takes hold, William Golding probes the darkness of human nature and the thin line between order and chaos. This Nobel laureate's debut novel remains one of the most thought-provoking and disturbing explorations of what happens when societal constraints are removed.",
     "tags": ["Human Nature", "Power", "Civilization", "Allegory"], "rating": 4.3},

    # ── CLASSIC ────────────────────────────────────────
    {"title": "Crime and Punishment", "author_id": "auth_013", "category": "Classic", "year": 1866, "pages": 671,
     "isbn": "978-0-143-10790-2", "language": "English", "publisher": "Penguin Classics",
     "description": "Raskolnikov, an impoverished student in 19th-century Saint Petersburg, convinces himself that murdering a pawnbroker would be morally justified—that great men are above conventional morality. After committing the murder, he is consumed by guilt and paranoia as a brilliant detective closes in. Dostoevsky's psychological masterpiece remains unsurpassed in its penetrating examination of guilt, redemption, and the moral complexity of the human psyche.",
     "tags": ["Guilt", "Psychology", "Morality", "Russian"], "rating": 4.9},

    {"title": "The Brothers Karamazov", "author_id": "auth_013", "category": "Classic", "year": 1880, "pages": 824,
     "isbn": "978-0-374-52837-7", "language": "English", "publisher": "Farrar, Straus & Giroux",
     "description": "Dostoevsky's final and most ambitious novel follows the Karamazov brothers—passionate, questioning Dmitri; cold, rational Ivan; and the gentle novice monk Alyosha—as they grapple with questions of faith, free will, morality, and patricide. Simultaneously a murder mystery and a profound inquiry into the existence of God and the nature of evil, it is widely regarded as the greatest novel ever written.",
     "tags": ["Faith", "Family", "Philosophy", "Russian"], "rating": 4.9},

    {"title": "Beloved", "author_id": "auth_004", "category": "Classic", "year": 1987, "pages": 275,
     "isbn": "978-1-400-03341-5", "language": "English", "publisher": "Alfred A. Knopf",
     "description": "Set in post-Civil War Ohio, Sethe—an escaped slave—is haunted by the ghost of her infant daughter, whom she killed to spare her from slavery. When a young woman calling herself Beloved appears at her door, Sethe's buried past begins to surface. Toni Morrison's Pulitzer Prize-winning novel is a shattering meditation on the psychic wounds of slavery, maternal love, and the terror of memory that refuses to die.",
     "tags": ["Slavery", "Memory", "Motherhood", "Pulitzer"], "rating": 4.7},

    {"title": "One Hundred Years of Solitude", "author_id": "auth_017", "category": "Classic", "year": 1967, "pages": 417,
     "isbn": "978-0-060-88328-7", "language": "English", "publisher": "Harper & Row",
     "description": "The multi-generational story of the Buendía family, founders of the fictional town of Macondo in Colombia, told over the course of a century. García Márquez blends magical realism with political allegory to create a sweeping portrait of Latin American history, the cycles of human folly, and the inevitability of fate. Winner of the Nobel Prize in Literature, this novel is the defining work of magical realism.",
     "tags": ["Magical Realism", "Family", "History", "Nobel"], "rating": 4.8},

    {"title": "Anna Karenina", "author_id": "auth_013", "category": "Classic", "year": 1878, "pages": 864,
     "isbn": "978-0-143-03500-4", "language": "English", "publisher": "Penguin Classics",
     "description": "Anna Karenina, a beautiful and passionate woman, is trapped in a loveless marriage to a cold bureaucrat. When she meets the dashing Count Vronsky, she risks everything for love—her social position, her family, her very existence. Tolstoy interweaves her story with that of the earnest Levin, searching for meaning in Russian aristocratic society. Widely considered one of the greatest and most emotionally rich novels ever written.",
     "tags": ["Love", "Society", "Marriage", "Russian"], "rating": 4.8},

    # ── SCIENCE FICTION ────────────────────────────────
    {"title": "Dune", "author_id": "auth_002", "category": "Sci-Fi", "year": 1965, "pages": 896,
     "isbn": "978-0-441-01359-3", "language": "English", "publisher": "Chilton Books",
     "description": "In the far future, noble House Atreides accepts stewardship of the desert planet Arrakis—the only source of the galaxy's most valuable substance. When a betrayal catapults young Paul Atreides into the desert wilderness with the native Fremen people, he must confront his possible destiny as a messiah figure. Herbert weaves ecology, religion, politics, and heroism into the most influential science fiction epic ever written.",
     "tags": ["Space Opera", "Politics", "Ecology", "Epic"], "rating": 4.8},

    {"title": "Dune Messiah", "author_id": "auth_002", "category": "Sci-Fi", "year": 1969, "pages": 331,
     "isbn": "978-0-441-01611-2", "language": "English", "publisher": "Putnam",
     "description": "Twelve years after the events of Dune, Paul Atreides rules as Emperor of the Known Universe. But the holy war fought in his name has killed sixty billion people. A conspiracy of powerful factions—the Bene Gesserit, the Spacing Guild, the Tleilaxu, and Princess Irulan—plots to depose him. Herbert's sequel subverts messianic mythology, depicting the terrible cost of prophecy fulfilled and power wielded without wisdom.",
     "tags": ["Sequels", "Politics", "Prophecy", "Betrayal"], "rating": 4.4},

    {"title": "Foundation", "author_id": "auth_011", "category": "Sci-Fi", "year": 1951, "pages": 255,
     "isbn": "978-0-553-29335-7", "language": "English", "publisher": "Gnome Press",
     "description": "Hari Seldon, a mathematician, develops psychohistory—the science of predicting the behavior of large populations. Foreseeing the fall of the Galactic Empire and a 30,000-year dark age, he establishes two 'Foundations' to preserve human knowledge and shorten the period of barbarism to a single millennium. Asimov's grandest work remains one of the most ambitious and structurally inventive science fiction series ever conceived.",
     "tags": ["Mathematics", "Empire", "Future", "Series"], "rating": 4.6},

    {"title": "The Hitchhiker's Guide to the Galaxy", "author_id": "auth_011", "category": "Sci-Fi", "year": 1979, "pages": 224,
     "isbn": "978-0-345-39180-3", "language": "English", "publisher": "Pan Books",
     "description": "Moments before Earth is demolished to make way for a hyperspace bypass, Arthur Dent is whisked off the planet by his friend Ford Prefect, who turns out to be an alien researcher for the eponymous Hitchhiker's Guide. What follows is a hilarious, whirlwind tour of the galaxy, featuring a depressed robot, a two-headed president of the galaxy, and the ultimate question about life, the universe, and everything.",
     "tags": ["Comedy", "Space", "British Humour", "Series"], "rating": 4.7},

    {"title": "Project Hail Mary", "author_id": "auth_018", "category": "Sci-Fi", "year": 2021, "pages": 480,
     "isbn": "978-0-593-13520-4", "language": "English", "publisher": "Ballantine Books",
     "description": "Ryland Grace wakes up alone on a spacecraft, with no memory of who he is or how he got there. He soon realizes he's on a one-man mission to save Earth from an extinction-level threat—an organism consuming the sun's energy. Part survival thriller, part first-contact story, Weir's most scientifically rigorous novel is a love letter to curiosity and the human capacity for problem-solving under impossible circumstances.",
     "tags": ["Hard Sci-Fi", "First Contact", "Survival", "Science"], "rating": 4.9},

    {"title": "Ender's Game", "author_id": "auth_018", "category": "Sci-Fi", "year": 1985, "pages": 352,
     "isbn": "978-0-812-55070-4", "language": "English", "publisher": "Tor Books",
     "description": "In the future, humanity has survived two alien invasions from the insectoid Buggers. To prepare for the third invasion, the military trains children from birth to be soldiers. Andrew 'Ender' Wiggin is a child prodigy who may be humanity's greatest hope—but the rigorous training at Battle School extracts a terrible price. A masterwork of military science fiction and one of the most beloved novels in the genre.",
     "tags": ["Military", "Child Prodigy", "Aliens", "Strategy"], "rating": 4.6},

    {"title": "Klara and the Sun", "author_id": "auth_019", "category": "Sci-Fi", "year": 2021, "pages": 307,
     "isbn": "978-0-571-36488-0", "language": "English", "publisher": "Faber & Faber",
     "description": "Klara is an Artificial Friend—a solar-powered humanoid robot who observes the world with extraordinary intelligence from the window of a store. When she is chosen by a teenage girl named Josie, Klara enters a world of human devotion and technological anxiety. Nobel laureate Ishiguro's haunting novel asks profound questions about what it means to be human and whether love can be manufactured or replicated.",
     "tags": ["Artificial Intelligence", "Love", "Technology", "Nobel"], "rating": 4.5},

    # ── BIOGRAPHY / MEMOIR ────────────────────────────
    {"title": "Becoming", "author_id": "auth_010", "category": "Biography", "year": 2018, "pages": 448,
     "isbn": "978-1-524-76313-8", "language": "English", "publisher": "Crown Publishing",
     "description": "In her memoir, Michelle Obama invites readers into her world, chronicling the experiences that have shaped her—from her childhood on the South Side of Chicago to her years as an executive balancing the demands of motherhood and work, to her time spent at the world's most famous address. Warm, wise, and revelatory, Becoming is the deeply personal reckoning of a woman of soul and substance who has steadily defied expectations.",
     "tags": ["Politics", "Race", "Womanhood", "America"], "rating": 4.8},

    {"title": "Steve Jobs", "author_id": "auth_022", "category": "Biography", "year": 2011, "pages": 656,
     "isbn": "978-1-451-64853-4", "language": "English", "publisher": "Simon & Schuster",
     "description": "Based on more than forty interviews with Steve Jobs conducted over two years—as well as interviews with more than a hundred family members, friends, adversaries, competitors, and colleagues—Isaacson tells the riveting story of the creative entrepreneur whose passion for perfection and ferocious drive revolutionized six industries: personal computers, animated movies, music, phones, tablet computing, and digital publishing.",
     "tags": ["Technology", "Apple", "Leadership", "Silicon Valley"], "rating": 4.6},

    {"title": "Leonardo da Vinci", "author_id": "auth_022", "category": "Biography", "year": 2017, "pages": 624,
     "isbn": "978-1-501-13979-2", "language": "English", "publisher": "Simon & Schuster",
     "description": "Based on thousands of pages from Leonardo's astonishing notebooks and new discoveries about his life and work, Walter Isaacson weaves a narrative that connects his art to his science. He shows how Leonardo's genius was based on skills we can all develop—curiosity, careful observation, and a playful imagination. A profound reflection on the intertwining of art and science, beauty and truth, that defined the Renaissance.",
     "tags": ["Art", "Renaissance", "Creativity", "Science"], "rating": 4.7},

    {"title": "The Diary of a Young Girl", "author_id": "auth_013", "category": "Biography", "year": 1947, "pages": 283,
     "isbn": "978-0-553-29698-3", "language": "English", "publisher": "Contact Publishing",
     "description": "Anne Frank's diary is the record of two years in hiding in Amsterdam during the Nazi occupation of the Netherlands, written between 1942 and 1944 with a clarity and vividness that belies her youth. More than just a historical document, it is the deeply personal account of a young girl growing up, falling in love for the first time, and grappling with the enormous forces of history bearing down on her hidden world.",
     "tags": ["Holocaust", "WWII", "Youth", "Netherlands"], "rating": 4.8},

    {"title": "Man's Search for Meaning", "author_id": "auth_012", "category": "Biography", "year": 1946, "pages": 165,
     "isbn": "978-0-807-01429-5", "language": "English", "publisher": "Beacon Press",
     "description": "Psychiatrist Viktor Frankl's memoir has riveted generations of readers with its account of his experiences as a prisoner in Nazi concentration camps and his psychotherapeutic method of finding meaning in all forms of existence, even in the most brutal and dehumanizing ones. Between 1942 and 1945, Frankl labored in four camps, including Auschwitz. This seminal work presents his theory of logotherapy and the will to meaning.",
     "tags": ["Holocaust", "Psychology", "Meaning", "Survival"], "rating": 4.9},

    {"title": "Open", "author_id": "auth_010", "category": "Biography", "year": 2009, "pages": 386,
     "isbn": "978-0-007-31108-0", "language": "English", "publisher": "HarperCollins",
     "description": "Andre Agassi's autobiography is one of the most honest and self-revealing books ever written by an athlete. Agassi opens with a riveting account of his 2006 US Open match and moves backwards and forwards through his life—his complex relationship with his obsessive father, his hatred of tennis as a child, his descent into drug use, and his late-career renaissance. A story of authenticity, transformation, and finding love.",
     "tags": ["Tennis", "Sports", "Addiction", "Redemption"], "rating": 4.5},

    # ── PHILOSOPHY ────────────────────────────────────
    {"title": "Meditations", "author_id": "auth_007", "category": "Philosophy", "year": 180, "pages": 254,
     "isbn": "978-0-14-044140-6", "language": "English", "publisher": "Penguin Classics",
     "description": "Written as private notes to himself—never intended for publication—Marcus Aurelius's Meditations offer a remarkable series of spiritual exercises and self-reminders. Drawing on the philosophy of the Stoics, Marcus counsels himself on how to be a better ruler, a better person, and a more virtuous philosopher. Two millennia later, his reflections on duty, mortality, and the examined life remain as applicable and moving as ever.",
     "tags": ["Stoicism", "Self-Improvement", "Ancient Rome", "Ethics"], "rating": 4.8},

    {"title": "Atomic Habits", "author_id": "auth_008", "category": "Philosophy", "year": 2018, "pages": 320,
     "isbn": "978-0-735-21129-2", "language": "English", "publisher": "Avery",
     "description": "Tiny Changes, Remarkable Results. Drawing on biology, psychology, and neuroscience, James Clear explains why habits are the compound interest of self-improvement. He reveals practical strategies to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results. With an engaging four-stage model—cue, craving, response, reward—this book is the most comprehensive guide ever written on the science of habits.",
     "tags": ["Habits", "Productivity", "Psychology", "Neuroscience"], "rating": 4.7},

    {"title": "The Courage to Be Disliked", "author_id": "auth_013", "category": "Philosophy", "year": 2013, "pages": 288,
     "isbn": "978-1-501-15701-4", "language": "English", "publisher": "Atria Books",
     "description": "A young man confronts a philosopher in a dialogue about the philosophy of Alfred Adler. In a series of five conversations, the philosopher dismantles the deterministic view of human behavior, arguing instead that we are free, in every moment, to choose our own lives. Drawing on Adlerian psychology, this book argues that liberation comes through accepting our freedom from the past and taking responsibility for our own happiness.",
     "tags": ["Adlerian", "Freedom", "Happiness", "Psychology"], "rating": 4.3},

    {"title": "Thinking, Fast and Slow", "author_id": "auth_022", "category": "Philosophy", "year": 2011, "pages": 499,
     "isbn": "978-0-374-27563-1", "language": "English", "publisher": "Farrar, Straus & Giroux",
     "description": "Nobel laureate Daniel Kahneman takes us on a groundbreaking tour of the mind, explaining the two systems that drive the way we think—System 1 (fast, intuitive, emotional) and System 2 (slower, deliberative, logical). He exposes the extraordinary capabilities and the faults and biases of fast thinking and reveals the pervasive influence of intuitive impressions on our thoughts and behavior. A must-read for anyone interested in the human mind.",
     "tags": ["Cognitive Bias", "Decision Making", "Economics", "Nobel"], "rating": 4.5},

    {"title": "Thus Spoke Zarathustra", "author_id": "auth_013", "category": "Philosophy", "year": 1883, "pages": 352,
     "isbn": "978-0-140-44118-5", "language": "English", "publisher": "Penguin Classics",
     "description": "In this philosophical novel, Nietzsche's prophet Zarathustra descends from his mountain retreat to share his wisdom with humanity. Through the use of allegory, symbol, and parable, he introduces concepts that would reshape modern philosophy: the Übermensch (Superman), the Will to Power, and the Eternal Recurrence. Written in a soaring poetic prose that mirrors the grand ambition of its ideas, this is one of the most important philosophical works of the 19th century.",
     "tags": ["Nietzsche", "Existentialism", "Meaning", "Morality"], "rating": 4.4},

    # ── MYSTERY / THRILLER ────────────────────────────
    {"title": "And Then There Were None", "author_id": "auth_006", "category": "Mystery", "year": 1939, "pages": 264,
     "isbn": "978-0-062-07348-8", "language": "English", "publisher": "Collins Crime Club",
     "description": "Ten strangers are lured to an isolated island mansion off the Devon coast by a mysterious host. One by one, they are accused of past murders for which they escaped justice—and then begin to die themselves, in the exact order of an old nursery rhyme. Christie's bestselling and most famous mystery is a masterpiece of narrative tension and misdirection, still as terrifyingly effective nearly a century after its first publication.",
     "tags": ["Detective", "Island", "Whodunit", "Classic"], "rating": 4.8},

    {"title": "Murder on the Orient Express", "author_id": "auth_006", "category": "Mystery", "year": 1934, "pages": 274,
     "isbn": "978-0-062-07387-7", "language": "English", "publisher": "Collins Crime Club",
     "description": "Hercule Poirot is travelling on the Orient Express when a fellow passenger is murdered in his locked compartment. Snowbound in the mountains of Yugoslavia, Poirot must identify the killer from among the thirteen suspects on board before the train arrives in London and the murderer escapes. Christie's most celebrated mystery features one of the most startling and psychologically resonant solutions in the history of crime fiction.",
     "tags": ["Poirot", "Train", "Locked Room", "Classic"], "rating": 4.7},

    {"title": "Gone Girl", "author_id": "auth_016", "category": "Mystery", "year": 2012, "pages": 422,
     "isbn": "978-0-307-58836-4", "language": "English", "publisher": "Crown Publishing",
     "description": "On the morning of their fifth wedding anniversary, Amy Dunne disappears from her home in Missouri. The media immediately suspects Nick Dunne of murdering his beautiful wife. Told in alternating perspectives—Nick's present-tense account and Amy's past diary entries—Flynn constructs an increasingly dark, twisting portrait of a marriage and a media-obsessed culture. A relentlessly clever psychological thriller with a truly shocking final act.",
     "tags": ["Marriage", "Psychological", "Media", "Unreliable Narrator"], "rating": 4.5},

    {"title": "The Girl with the Dragon Tattoo", "author_id": "auth_016", "category": "Mystery", "year": 2005, "pages": 672,
     "isbn": "978-0-307-45454-1", "language": "English", "publisher": "Norstedts Förlag",
     "description": "Journalist Mikael Blomkvist and the hacker Lisbeth Salander—one of fiction's most compelling protagonists—team up to investigate a forty-year-old disappearance within the powerful Vanger family dynasty. What begins as a cold case becomes a probe into the dark heart of Sweden's most powerful families and a catalogue of violence against women. The first in Stieg Larsson's Millennium trilogy became a global publishing phenomenon.",
     "tags": ["Sweden", "Hacker", "Serial Killer", "Journalism"], "rating": 4.5},

    {"title": "The Name of the Rose", "author_id": "auth_013", "category": "Mystery", "year": 1980, "pages": 502,
     "isbn": "978-0-156-00101-1", "language": "English", "publisher": "Bompiani",
     "description": "In an Italian Benedictine monastery in 1327, a series of mysterious deaths begins to occur. Brother William of Baskerville, a Franciscan friar and former inquisitor with extraordinary deductive powers, arrives with his novice Adso and is asked to investigate. Umberto Eco's labyrinthine debut novel is simultaneously a whodunit, a philosophical treatise, a meditation on semiotics, and a richly researched recreation of medieval monastic life.",
     "tags": ["Medieval", "Monks", "Books", "Logic"], "rating": 4.6},

    # ── HISTORY ───────────────────────────────────────
    {"title": "Sapiens: A Brief History of Humankind", "author_id": "auth_005", "category": "History", "year": 2011, "pages": 512,
     "isbn": "978-0-062-31610-0", "language": "English", "publisher": "Harvill Secker",
     "description": "100,000 years ago, at least six species of humans inhabited Earth. Today there is just one. How did Homo sapiens come to dominate the planet? Yuval Noah Harari journeys through the Cognitive Revolution, the Agricultural Revolution, and the Scientific Revolution, exploring how history has shaped human societies, from forager bands to agricultural empires to modern industrial states. A paradigm-shifting work of macro-history.",
     "tags": ["Anthropology", "Evolution", "Culture", "Science"], "rating": 4.6},

    {"title": "Homo Deus: A Brief History of Tomorrow", "author_id": "auth_005", "category": "History", "year": 2015, "pages": 464,
     "isbn": "978-0-062-44418-0", "language": "English", "publisher": "Harvill Secker",
     "description": "Following the sweeping success of Sapiens, Harari turns his gaze to humanity's future. As famine, plague, and war become manageable problems, what new projects will replace them? Harari examines the new human agendas emerging at the dawn of the 21st century—from extending human lifespan to achieving godlike powers of creation. A provocative meditation on where we are heading as a species and what we risk losing along the way.",
     "tags": ["Future", "Technology", "Consciousness", "Posthumanism"], "rating": 4.4},

    {"title": "A Brief History of Time", "author_id": "auth_015", "category": "History", "year": 1988, "pages": 212,
     "isbn": "978-0-553-38016-3", "language": "English", "publisher": "Bantam Books",
     "description": "Was there a beginning of time? Could time run backwards? Is the universe infinite or does it have boundaries? In this landmark volume, cutting-edge science is presented with breathtaking clarity by one of the great intellects of our time. Stephen Hawking's transformative book made cosmology accessible to millions of readers and became one of the bestselling popular science books of all time.",
     "tags": ["Cosmology", "Physics", "Black Holes", "Space-Time"], "rating": 4.7},

    {"title": "The Silk Roads: A New History of the World", "author_id": "auth_022", "category": "History", "year": 2015, "pages": 672,
     "isbn": "978-1-408-83818-6", "language": "English", "publisher": "Bloomsbury Publishing",
     "description": "A monumental reassessment of world history, this book shows how it was the connections between East and West—the Silk Roads—that formed the foundations for the modern world. Peter Frankopan reveals how the great power struggles of history have always centred on the vast terrain connecting Europe to the Pacific, and how it is this 'axis of the world' that will shape the future of international affairs.",
     "tags": ["Trade Routes", "East-West", "Empire", "Global"], "rating": 4.5},

    {"title": "Guns, Germs, and Steel", "author_id": "auth_022", "category": "History", "year": 1997, "pages": 528,
     "isbn": "978-0-393-06131-4", "language": "English", "publisher": "W. W. Norton",
     "description": "Why did Eurasian civilisation come to dominate the world? Jared Diamond's Pulitzer Prize-winning work argues that the answer lies not in racial or cultural superiority, but in geography and environmental factors—the availability of domesticable plants and animals, and the orientation of continents that allowed technologies to spread. A sweeping, scientifically grounded account of why the world looks the way it does.",
     "tags": ["Geography", "Colonialism", "Civilization", "Pulitzer"], "rating": 4.5},

    # ── CONTEMPORARY ──────────────────────────────────
    {"title": "Norwegian Wood", "author_id": "auth_003", "category": "Contemporary", "year": 1987, "pages": 389,
     "isbn": "978-0-375-70402-4", "language": "English", "publisher": "Kodansha",
     "description": "Set in Tokyo in the late 1960s, this bittersweet story of loss and coming-of-age follows Toru Watanabe as he reflects on his youth and his relationships with two very different women: Naoko, the girlfriend of his late best friend, who is emotionally fragile and ultimately unreachable, and Midori, a free spirit who represents the life and love that awaits him. Murakami's most directly autobiographical novel is his most emotionally devastating.",
     "tags": ["Love", "Coming of Age", "Loss", "Tokyo"], "rating": 4.5},

    {"title": "Kafka on the Shore", "author_id": "auth_003", "category": "Contemporary", "year": 2002, "pages": 505,
     "isbn": "978-1-400-04366-6", "language": "English", "publisher": "Shinchosha",
     "description": "Alternating between the story of fifteen-year-old Kafka Tamura, who runs away to Takamatsu, and Nakata, an aging simpleton who has the ability to talk to cats, the novel moves through planes of reality, surrealism, and myth. Fish rain from the sky. A piper leads cats into the underworld. Kafka opens a library and befriends an enigmatic young librarian. Murakami's most complex and hypnotic novel.",
     "tags": ["Magical Realism", "Dreams", "Japan", "Identity"], "rating": 4.4},

    {"title": "Never Let Me Go", "author_id": "auth_019", "category": "Contemporary", "year": 2005, "pages": 288,
     "isbn": "978-1-400-04339-0", "language": "English", "publisher": "Faber & Faber",
     "description": "In a slightly alternate version of England, three friends grow up together at the idyllic boarding school Hailsham. The narrator, Kathy H., slowly reveals the disturbing truth about their existence—and what the future holds for them. Ishiguro's devastating meditation on memory, loss, and what it means to be human is written in a gentle, measured prose that makes its revelations all the more heartbreaking.",
     "tags": ["Memory", "Identity", "Ethics", "British"], "rating": 4.5},

    {"title": "Americanah", "author_id": "auth_014", "category": "Contemporary", "year": 2013, "pages": 477,
     "isbn": "978-0-307-45592-0", "language": "English", "publisher": "Alfred A. Knopf",
     "description": "Ifemelu and Obinze are young and in love when they leave military-ruled Nigeria for the West. Ifemelu heads for America, where despite her academic success, she is forced to grapple with what it means to be black for the first time. Obinze heads for a post-9/11 London seeking to follow her. Adichie's National Book Critics Circle Award-winning novel is a luminous portrait of race, identity, and love.",
     "tags": ["Race", "Immigration", "Africa", "America"], "rating": 4.6},

    {"title": "The Midnight Library", "author_id": "auth_021", "category": "Contemporary", "year": 2020, "pages": 304,
     "isbn": "978-0-525-55947-4", "language": "English", "publisher": "Canongate",
     "description": "Nora Seed finds herself in a magical library between life and death, containing infinite books, each one the story of another life she could have lived if she had made different choices. As she tries out different versions of her life to find the most fulfilling one, she must ask herself: what does it truly mean to live? Matt Haig's philosophical novel is a moving examination of regret, possibility, and what makes life worth living.",
     "tags": ["Parallel Lives", "Regret", "Depression", "Hope"], "rating": 4.4},

    # ── SELF-HELP ─────────────────────────────────────
    {"title": "The 7 Habits of Highly Effective People", "author_id": "auth_020", "category": "Self-Help", "year": 1989, "pages": 464,
     "isbn": "978-0-743-26951-3", "language": "English", "publisher": "Free Press",
     "description": "Stephen Covey presents a framework for personal and professional effectiveness based on seven fundamental habits. Moving beyond time management and goal-setting to deeper principles of character ethics—integrity, human dignity, and service—this book offers an integrated, principle-centred approach to solving personal and professional problems. Named the most influential business book of the 20th century by Time magazine.",
     "tags": ["Leadership", "Habits", "Character", "Business"], "rating": 4.5},

    {"title": "The Power of Now", "author_id": "auth_017", "category": "Self-Help", "year": 1997, "pages": 236,
     "isbn": "978-1-577-31480-6", "language": "English", "publisher": "Namaste Publishing",
     "description": "Eckhart Tolle's transformative guide to spiritual enlightenment shows how to free ourselves from the tyranny of the mind—the incessant mental noise that breeds suffering. By accessing the still, alert presence behind thought—our deepest, truest self—we discover peace, joy, and love that are not contingent on external circumstances. One of the most transformative spiritual books ever written, now with over 3 million copies sold in North America alone.",
     "tags": ["Mindfulness", "Presence", "Spirituality", "Consciousness"], "rating": 4.3},

    {"title": "Daring Greatly", "author_id": "auth_020", "category": "Self-Help", "year": 2012, "pages": 320,
     "isbn": "978-1-592-40733-1", "language": "English", "publisher": "Gotham Books",
     "description": "Based on twelve years of research and hundreds of interviews, Brené Brown argues that vulnerability—the willingness to show up and be seen without knowing the outcome—is our most accurate measure of courage. Through personal stories, academic research, and thoughtful analysis of everything from parenting and education to corporate culture, she shows how embracing vulnerability transforms the way we live, love, parent, and lead.",
     "tags": ["Vulnerability", "Courage", "Shame", "Leadership"], "rating": 4.4},

    {"title": "Deep Work", "author_id": "auth_008", "category": "Self-Help", "year": 2016, "pages": 304,
     "isbn": "978-1-455-58669-1", "language": "English", "publisher": "Grand Central Publishing",
     "description": "Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information and produce better results in less time. Author Cal Newport argues that this ability is becoming increasingly rare and increasingly valuable in our economy. He provides a rigorous training regimen, building mental muscles for focusing on hard things in a world addicted to distraction.",
     "tags": ["Focus", "Productivity", "Technology", "Knowledge Work"], "rating": 4.6},

    {"title": "The Subtle Art of Not Giving a F*ck", "author_id": "auth_020", "category": "Self-Help", "year": 2016, "pages": 224,
     "isbn": "978-0-062-45773-0", "language": "English", "publisher": "HarperOne",
     "description": "In this counterintuitive self-help guide, Mark Manson argues that improving our lives hinges not on positivity but on learning to endure, struggle, and question ourselves honestly. Based on the idea that we only have a certain number of f*cks to give—and we should reserve them for what truly matters—this book cuts through the noise of conventional self-help wisdom with brutal honesty, irreverent humour, and surprising philosophical depth.",
     "tags": ["Honesty", "Values", "Counterintuitive", "Psychology"], "rating": 4.3},

    # ── FANTASY ──────────────────────────────────────
    {"title": "The Hobbit", "author_id": "auth_009", "category": "Fantasy", "year": 1937, "pages": 310,
     "isbn": "978-0-618-00221-4", "language": "English", "publisher": "Allen & Unwin",
     "description": "Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, rarely travelling farther than his pantry or cellar. But his contentment is disturbed when the wizard Gandalf and a company of thirteen dwarves arrive on his doorstep one day to whisk him away on an adventure. An irresistible tale of an ordinary person discovering extraordinary courage, The Hobbit is one of the most beloved books in all of English literature.",
     "tags": ["Adventure", "Dragons", "Magic", "Middle-Earth"], "rating": 4.7},

    {"title": "The Fellowship of the Ring", "author_id": "auth_009", "category": "Fantasy", "year": 1954, "pages": 423,
     "isbn": "978-0-618-57494-1", "language": "English", "publisher": "Allen & Unwin",
     "description": "Frodo Baggins inherits a Ring of immense power from his uncle Bilbo. When the wizard Gandalf reveals that the Ring is the One Ring—forged by the Dark Lord Sauron—Frodo must leave his comfortable home and embark on a perilous journey across Middle-earth to destroy it. The first volume of Tolkien's masterpiece establishes one of the most fully-realised imaginary worlds in literary history.",
     "tags": ["Epic", "Quest", "World-Building", "Friendship"], "rating": 4.8},

    {"title": "The Name of the Wind", "author_id": "auth_021", "category": "Fantasy", "year": 2007, "pages": 662,
     "isbn": "978-0-756-40474-1", "language": "English", "publisher": "DAW Books",
     "description": "Kvothe is a legend—the most feared, mysterious figure in his time. But what separates the story-Kvothe from the true Kvothe? Now an innkeeper trying to hide from the world, Kvothe tells his life story to the Chronicler over three days. Rothfuss's debut is a stunning achievement: a richly imagined world, a magic system of extraordinary elegance, and a narrator of almost unbearable intelligence and charisma.",
     "tags": ["Magic System", "Music", "Coming of Age", "Frame Story"], "rating": 4.8},

    {"title": "A Wise Man's Fear", "author_id": "auth_021", "category": "Fantasy", "year": 2011, "pages": 994,
     "isbn": "978-0-756-40472-7", "language": "English", "publisher": "DAW Books",
     "description": "The second day of Kvothe's tale continues as he ventures beyond the walls of the University, seeking to understand the nature of the mythical Chandrian. He travels to the court of a powerful ruler, the forests of the Fae with a dangerous being, and the training grounds of the legendary fighters known as the Adem. Rothfuss expands his world magnificently, revealing new layers of his magic system and deepening the mystery at the story's core.",
     "tags": ["Magic", "Adventure", "Martial Arts", "Sequels"], "rating": 4.7},

    # ── MORE FILLING ENTRIES ──────────────────────────
    {"title": "The Alchemist", "author_id": "auth_017", "category": "Contemporary", "year": 1988, "pages": 208,
     "isbn": "978-0-062-31500-4", "language": "English", "publisher": "HarperOne",
     "description": "A young Andalusian shepherd named Santiago travels from Spain to Egypt after having a recurring dream of finding treasure near the Pyramids. Along the way he meets a Romani woman, a king, an Englishman, and an alchemist. Each of these characters gives Santiago a clue as to what his Personal Legend is and how he might achieve it. Coelho's novel is a lyrical, transformative parable about following your heart and listening to the universe.",
     "tags": ["Personal Legend", "Journey", "Spiritual", "Parable"], "rating": 4.3},

    {"title": "Outliers: The Story of Success", "author_id": "auth_018", "category": "Self-Help", "year": 2008, "pages": 309,
     "isbn": "978-0-316-01792-3", "language": "English", "publisher": "Little, Brown and Company",
     "description": "Malcolm Gladwell examines the factors that contribute to high levels of success. Through the stories of software billionaires, rock stars, and top athletes, he shows that success is less about individual talent than about cultural background, family, and the opportunities presented—including being born in the right year. The book popularised the 10,000-hour rule and fundamentally reshaped how we think about achievement.",
     "tags": ["Success", "Culture", "10000 Hours", "Sociology"], "rating": 4.3},

    {"title": "Blink: The Power of Thinking Without Thinking", "author_id": "auth_018", "category": "Philosophy", "year": 2005, "pages": 296,
     "isbn": "978-0-316-17232-5", "language": "English", "publisher": "Little, Brown and Company",
     "description": "In his breakthrough bestseller, Malcolm Gladwell explores the power of rapid cognition—the kind of thinking that happens in the blink of an eye. By examining case studies from art experts spotting fakes to tennis coaches predicting double faults, Gladwell argues that our gut reactions are often more powerful and accurate than lengthy analysis, while also showing when snap judgements can lead us terribly astray.",
     "tags": ["Intuition", "Decision Making", "Unconscious", "Psychology"], "rating": 4.1},

    {"title": "We Should All Be Feminists", "author_id": "auth_014", "category": "Philosophy", "year": 2014, "pages": 64,
     "isbn": "978-1-101-91176-6", "language": "English", "publisher": "Anchor",
     "description": "Adapted from her much-viewed TEDx talk, Chimamanda Ngozi Adichie offers a unique definition of feminism for the 21st century—one firmly grounded in inclusion and aware of race, class, and cultural differences. With characteristic clarity and warmth, she argues that both men and women must reclaim the word 'feminism,' and that doing so is not just important but urgent. A powerful, eloquent and necessary essay.",
     "tags": ["Feminism", "Gender", "Africa", "Equality"], "rating": 4.5},

    {"title": "Purple Hibiscus", "author_id": "auth_014", "category": "Contemporary", "year": 2003, "pages": 307,
     "isbn": "978-1-616-20209-4", "language": "English", "publisher": "Algonquin Books",
     "description": "Fifteen-year-old Kambili lives in a house ruled by her devout Catholic father—a powerful industrialist who controls his family with religious fanaticism and physical violence, while being celebrated as a philanthropist. When Kambili and her brother visit their unconventional aunt in Nsukka, they encounter freedom, laughter, and love for the first time. Adichie's debut novel is a piercing exploration of faith, family, and political upheaval.",
     "tags": ["Nigeria", "Family", "Religion", "Abuse"], "rating": 4.4},

    {"title": "The Tipping Point", "author_id": "auth_018", "category": "Philosophy", "year": 2000, "pages": 301,
     "isbn": "978-0-316-31696-5", "language": "English", "publisher": "Little, Brown and Company",
     "description": "Why do some ideas, products, and behaviors spread like wildfire while others never catch on? In this fascinating analysis, Malcolm Gladwell explores the epidemiology of ideas, showing how small things can make a big difference. He identifies the three key agents of social change—Connectors, Mavens, and Salesmen—and reveals the conditions under which ideas tip into social phenomena. A book that transformed how we think about influence.",
     "tags": ["Social Trends", "Epidemics", "Influence", "Change"], "rating": 4.2},

    {"title": "The God of Small Things", "author_id": "auth_004", "category": "Contemporary", "year": 1997, "pages": 321,
     "isbn": "978-0-812-97887-2", "language": "English", "publisher": "India Ink",
     "description": "Told in non-linear form across the lives of the fraternal twins Rahel and Estha growing up in Kerala, India, this Booker Prize-winning debut novel traces the consequences of a love affair that breaks the rules of India's caste system. Arundhati Roy's prose is extraordinary—at once lyrical and precise, political and personal. A searing meditation on how the laws that bind a society can destroy it from within.",
     "tags": ["India", "Caste", "Love", "Booker Prize"], "rating": 4.5},

    {"title": "Good Omens", "author_id": "auth_011", "category": "Fantasy", "year": 1990, "pages": 383,
     "isbn": "978-0-552-13703-4", "language": "English", "publisher": "Gollancz",
     "description": "According to The Nice and Accurate Prophecies of Agnes Nutter, Witch, the world will end on a Saturday. An angel and a demon who have become quite attached to life on Earth decide to avert the apocalypse, but they've lost the Antichrist. A delight of satirical fantasy, combining the wit of Terry Pratchett with the humane invention of Neil Gaiman, this novel is a hilarious and thoughtful meditation on the nature of good and evil.",
     "tags": ["Comedy", "Angels", "Demons", "Apocalypse"], "rating": 4.7},

    {"title": "American Gods", "author_id": "auth_009", "category": "Fantasy", "year": 2001, "pages": 635,
     "isbn": "978-0-380-97365-7", "language": "English", "publisher": "William Morrow",
     "description": "Shadow Moon is released from prison only to discover his wife has died. He is recruited as bodyguard by the mysterious Mr. Wednesday and drawn into a battle between the old gods—brought to America by immigrants and now forgotten—and the new gods of media, technology, and globalization. Neil Gaiman's Hugo and Nebula Award-winning novel is a mythic road trip through American identity and the nature of belief.",
     "tags": ["Mythology", "America", "Gods", "Road Trip"], "rating": 4.5},

    {"title": "The Left Hand of Darkness", "author_id": "auth_013", "category": "Sci-Fi", "year": 1969, "pages": 280,
     "isbn": "978-0-441-47812-5", "language": "English", "publisher": "Ace Books",
     "description": "On the planet Gethen—a world of perpetual winter—there is no war because there is no gender. Its inhabitants are ambisexual, experiencing sexuality only during a monthly cycle. Genly Ai, an envoy from the interplanetary Ekumen, struggles to understand this alien civilization and to persuade its leaders to join the interstellar community. Le Guin's Nebula and Hugo Award-winning masterwork is a profound exploration of gender, politics, and what it means to be human.",
     "tags": ["Gender", "Anthropology", "Ursula Le Guin", "Political"], "rating": 4.5},

    {"title": "Shōgun", "author_id": "auth_022", "category": "History", "year": 1975, "pages": 1152,
     "isbn": "978-0-385-29224-8", "language": "English", "publisher": "Doubleday",
     "description": "It is 1600 and the Englishman John Blackthorne is the first Western navigator to reach Japan. He arrives during a time of tremendous political turmoil—the fragile peace among rival warlords is about to shatter. Blackthorne's destiny becomes intertwined with that of the feudal lord Toranaga, who is plotting to become Shōgun. James Clavell's epic masterpiece brings feudal Japan to life with extraordinary richness and authority.",
     "tags": ["Japan", "Feudal", "Epic", "East-West"], "rating": 4.6},

    {"title": "Educated", "author_id": "auth_010", "category": "Biography", "year": 2018, "pages": 352,
     "isbn": "978-0-399-59050-4", "language": "English", "publisher": "Random House",
     "description": "Tara Westover grew up preparing for the End of Days, never setting foot in a classroom. Her survivalist family in Idaho distrusted modern medicine and government. At seventeen, she taught herself enough to pass the ACT, left for Brigham Young University, and eventually earned a PhD from Cambridge. This memoir is about the struggle to forge an identity while remaining loyal to the family and community that shaped you.",
     "tags": ["Education", "Family", "Idaho", "Survivalism"], "rating": 4.7},

    {"title": "When Breath Becomes Air", "author_id": "auth_015", "category": "Biography", "year": 2016, "pages": 228,
     "isbn": "978-0-812-98840-6", "language": "English", "publisher": "Random House",
     "description": "At the age of thirty-six, on the verge of completing a decade's worth of training as a neurosurgeon, Paul Kalanithi was diagnosed with stage IV lung cancer. In this extraordinary memoir, he reflects on what makes a life worth living and what medicine can do for patients facing death. Written from his deathbed with unflinching honesty and transcendent wisdom, this book is an indelible account of what it is to live with the knowledge of death.",
     "tags": ["Medicine", "Death", "Meaning", "Cancer"], "rating": 4.7},

    {"title": "The Subtle Knife", "author_id": "auth_009", "category": "Fantasy", "year": 1997, "pages": 341,
     "isbn": "978-0-679-87924-3", "language": "English", "publisher": "Scholastic",
     "description": "In the second volume of the His Dark Materials trilogy, Lyra crosses into a third world and meets Will Parry, a boy from our world who has accidentally killed a man. Together they discover the Subtle Knife, an ancient weapon that can cut windows between worlds. As the forces of the Magisterium close in and Will searches for his missing father, darker truths about the nature of Dust—and the fate of all creation—begin to emerge.",
     "tags": ["Parallel Worlds", "Knife", "Consciousness", "Coming of Age"], "rating": 4.5},

    {"title": "12 Rules for Life: An Antidote to Chaos", "author_id": "auth_008", "category": "Self-Help", "year": 2018, "pages": 448,
     "isbn": "978-0-345-81602-3", "language": "English", "publisher": "Random House Canada",
     "description": "Jordan Peterson, one of the world's most influential thinkers, offers twelve profound and practical principles for how to live a meaningful life, from setting your house in order before criticising the world, to learning to pet cats when you meet them on the street. He draws on mythology, psychology, religion, and his clinical experience to give us the tools to face the chaos of existence with courage and responsibility.",
     "tags": ["Order", "Responsibility", "Meaning", "Jung"], "rating": 4.2},

    {"title": "Zero to One", "author_id": "auth_022", "category": "Self-Help", "year": 2014, "pages": 224,
     "isbn": "978-0-804-13929-5", "language": "English", "publisher": "Crown Business",
     "description": "Peter Thiel, co-founder of PayPal and one of Silicon Valley's most contrarian thinkers, builds his argument that we are in a moment of technological stagnation and that true innovation—going from zero to one—requires building something genuinely new. Drawing on his experience at PayPal and as an investor in Facebook, SpaceX, and others, he offers unconventional lessons about strategy, competition, and the nature of monopoly.",
     "tags": ["Startups", "Innovation", "Technology", "Business"], "rating": 4.3},

    {"title": "The Old Man and the Sea", "author_id": "auth_013", "category": "Classic", "year": 1952, "pages": 127,
     "isbn": "978-0-684-83049-5", "language": "English", "publisher": "Charles Scribner's Sons",
     "description": "An aging Cuban fisherman, alone in a small skiff, hooks a great marlin far out in the Gulf Stream. What follows is the story of his heroic three-day struggle with the fish—and with his own limitations, his pride, and the indifferent forces of nature. Hemingway's Pulitzer Prize-winning novella is a meditation on human endurance, the dignity of the individual, and the relationship between man and nature.",
     "tags": ["Cuba", "Fishing", "Struggle", "Nobel"], "rating": 4.5},

    {"title": "The Great Gatsby", "author_id": "auth_013", "category": "Classic", "year": 1925, "pages": 180,
     "isbn": "978-0-743-27356-5", "language": "English", "publisher": "Charles Scribner's Sons",
     "description": "Nick Carraway moves to Long Island during the Roaring Twenties and becomes entangled in the glittering world of his mysterious millionaire neighbor Jay Gatsby. F. Scott Fitzgerald's novel is a devastating critique of the American Dream—showing how the relentless pursuit of wealth and status leads to corruption, disillusionment, and tragedy. A perfectly constructed short novel, its prose remaining among the most beautiful in American literature.",
     "tags": ["American Dream", "Jazz Age", "Class", "Decadence"], "rating": 4.5},

    {"title": "Animal Farm", "author_id": "auth_001", "category": "Classic", "year": 1945, "pages": 112,
     "isbn": "978-0-451-52634-2", "language": "English", "publisher": "Secker & Warburg",
     "description": "When the overworked animals of Manor Farm overthrow their drunken farmer, they set up an egalitarian animal republic. But power corrupts, and the pigs—under the brilliant Napoleon—gradually consolidate control, revising history and exploiting the other animals. Orwell's devastating allegorical fable is one of the most biting and enduring critiques of totalitarianism, Stalinism, and the perversion of revolutionary ideals.",
     "tags": ["Allegory", "Politics", "Revolution", "Satire"], "rating": 4.7},

    {"title": "Wuthering Heights", "author_id": "auth_004", "category": "Classic", "year": 1847, "pages": 342,
     "isbn": "978-0-141-43955-6", "language": "English", "publisher": "Thomas Cautley Newby",
     "description": "The foundational Gothic romance, set on the wild Yorkshire moors. Heathcliff, a brooding foundling, and Catherine Earnshaw, the daughter of the family that takes him in, develop an intense, passionate love that becomes the defining force of their lives and the lives of the next generation. Emily Brontë's only novel is a fierce, haunting tale of love, revenge, class, and the destructive power of thwarted passion.",
     "tags": ["Gothic", "Romance", "Yorkshire", "Revenge"], "rating": 4.4},

    {"title": "Jane Eyre", "author_id": "auth_004", "category": "Classic", "year": 1847, "pages": 507,
     "isbn": "978-0-141-44480-2", "language": "English", "publisher": "Smith, Elder & Co.",
     "description": "Jane Eyre grows up as an orphan under harsh circumstances, eventually finding work as a governess at Thornfield Hall, where she falls in love with the passionate and mysterious Rochester. Charlotte Brontë's novel was revolutionary in its portrayal of a woman who insists on her own dignity and independence in a world that would deny her both. One of the most beloved and influential novels in the English language.",
     "tags": ["Gothic", "Romance", "Feminism", "Victorian"], "rating": 4.6},

    {"title": "The Trial", "author_id": "auth_013", "category": "Classic", "year": 1925, "pages": 176,
     "isbn": "978-0-805-20901-9", "language": "English", "publisher": "Verlag Die Schmiede",
     "description": "Josef K. wakes one morning and is arrested, charged with a crime he does not know. He spends the rest of the novel attempting to find the nature of his crime and navigate an opaque, menacing legal system. Kafka's nightmarish masterpiece of existential dread has lent its author's name to any bureaucratic labyrinth—Kafkaesque—and remains the most definitive literary portrait of the individual confronting an indifferent institutional power.",
     "tags": ["Kafka", "Bureaucracy", "Existentialism", "Absurdism"], "rating": 4.4},

    {"title": "Siddhartha", "author_id": "auth_012", "category": "Philosophy", "year": 1922, "pages": 152,
     "isbn": "978-0-553-20884-7", "language": "English", "publisher": "S. Fischer Verlag",
     "description": "The young Brahmin Siddhartha leaves his privileged home to join the ascetics, then abandons them to pursue worldly experience, becoming a merchant and lover before finding enlightenment by a river as an old ferryman. Hermann Hesse's luminous novella is a spiritual journey that transcends any single religion, asking how a person might find their way to peace and wholeness through direct experience rather than doctrine.",
     "tags": ["Buddhism", "Enlightenment", "India", "Spirituality"], "rating": 4.5},

    {"title": "In Search of Lost Time, Vol. 1", "author_id": "auth_013", "category": "Classic", "year": 1913, "pages": 608,
     "isbn": "978-0-142-18009-4", "language": "English", "publisher": "Grasset",
     "description": "The opening volume of Marcel Proust's monumental seven-part novel, Swann's Way introduces the narrator as a boy in Combray and traces his memories as they crystallise from a single taste of a madeleine dipped in lime-blossom tea. A revolutionary exploration of memory, time, consciousness, and art, In Search of Lost Time is widely considered the greatest novel of the twentieth century—and one of the most demanding.",
     "tags": ["Memory", "Time", "Modernism", "French"], "rating": 4.3},

    # Fill to 100+ with additional entries
    {"title": "The Remains of the Day", "author_id": "auth_019", "category": "Contemporary", "year": 1989, "pages": 258,
     "isbn": "978-0-571-15382-1", "language": "English", "publisher": "Faber & Faber",
     "description": "Stevens, an English butler, travels to visit his former housekeeper, Miss Kenton, in the hope she might return to Darlington Hall and help reverse the steady decline of the household. As he drives through the West Country, he reflects on his years of service—and on his steadfast, unquestioning devotion to duty at the expense of love and personal happiness. Ishiguro's Booker Prize-winning novel is a heartbreaking study in repression and regret.",
     "tags": ["England", "Duty", "Regret", "Booker Prize"], "rating": 4.6},

    {"title": "The Kite Runner", "author_id": "auth_021", "category": "Contemporary", "year": 2003, "pages": 372,
     "isbn": "978-1-594-48000-3", "language": "English", "publisher": "Riverhead Books",
     "description": "Amir, the privileged son of a Kabul merchant, and Hassan, the son of his servant, are the closest of friends until a devastating event tears them apart. Years later, Amir—now living in America—receives a call from Pakistan that gives him a chance to right what went wrong. Hosseini's debut novel is a sweeping story of fathers and sons, of friendship and betrayal, of guilt and redemption, set against the backdrop of Afghanistan's turbulent recent history.",
     "tags": ["Afghanistan", "Friendship", "Guilt", "Redemption"], "rating": 4.5},

    {"title": "The Shadow of the Wind", "author_id": "auth_013", "category": "Mystery", "year": 2001, "pages": 487,
     "isbn": "978-0-143-03490-8", "language": "English", "publisher": "Planeta",
     "description": "In post-war Barcelona, a boy named Daniel discovers a mysterious book by Julian Carax in the Cemetery of Forgotten Books and becomes obsessed with finding the author's other works—only to discover that someone is burning all copies of Carax's novels. Carlos Ruiz Zafón's Gothic mystery is a love letter to literature itself and to the labyrinthine city of Barcelona, richly atmospheric and utterly compelling from first page to last.",
     "tags": ["Barcelona", "Books", "Gothic", "Mystery"], "rating": 4.6},

    {"title": "Pachinko", "author_id": "auth_019", "category": "Contemporary", "year": 2017, "pages": 485,
     "isbn": "978-1-455-57552-7", "language": "English", "publisher": "Grand Central Publishing",
     "description": "Following a Korean family through eight decades of triumph and endurance—from a fishing village near Busan in the 1910s to an Osaka Pachinko parlor in the 1980s—Min Jin Lee's epic saga is a masterfully crafted examination of identity, sacrifice, and the immigrant experience in Japan. A National Book Award finalist, it is a passionate hymn to all those who face discrimination yet choose to persist.",
     "tags": ["Korea", "Japan", "Immigration", "Family Saga"], "rating": 4.7},

    {"title": "The Power of the Dog", "author_id": "auth_016", "category": "Mystery", "year": 1967, "pages": 256,
     "isbn": "978-0-316-01847-0", "language": "English", "publisher": "Little, Brown",
     "description": "Set in 1920s Montana, ranching brothers Phil and George Burbank couldn't be more different. When George unexpectedly marries a young widow, Rose Gordon, her arrival at the ranch triggers a chain of psychological terror at the hands of Phil. Thomas Savage's long-neglected masterpiece—described by Annie Proulx as the best American novel of the twentieth century—is a devastating study of repression, masculinity, and cruelty.",
     "tags": ["Montana", "Masculinity", "Repression", "Ranch"], "rating": 4.4},

    {"title": "East of Eden", "author_id": "auth_013", "category": "Classic", "year": 1952, "pages": 601,
     "isbn": "978-0-142-00404-9", "language": "English", "publisher": "Viking Press",
     "description": "John Steinbeck's masterpiece is a sprawling, multigenerational saga of two families in California's Salinas Valley—the Trasks and the Hamiltons—whose histories mirror the biblical story of Cain and Abel. At its heart are timshel—the Hebrew word for 'thou mayest'—and the freedom of humans to choose between good and evil. Steinbeck considered this his greatest novel, saying it 'contains everything I have been able to learn about my craft.'",
     "tags": ["California", "Biblical", "Family", "Good vs Evil"], "rating": 4.7},

    {"title": "The Wind-Up Bird Chronicle", "author_id": "auth_003", "category": "Contemporary", "year": 1994, "pages": 607,
     "isbn": "978-0-679-75031-4", "language": "English", "publisher": "Shinchosha",
     "description": "When Toru Okada's cat goes missing, then his wife Kumiko, he is propelled on a surrealistic quest through the back alleys of Tokyo and the dark corridors of his own unconscious. Murakami's most ambitious novel weaves together threads of history, violence, loss, and memory in a vast tapestry that encompasses World War II atrocities and the quiet tragedy of suburban life. Murakami at the height of his visionary powers.",
     "tags": ["Japan", "Surrealism", "WWII", "Identity"], "rating": 4.5},

    {"title": "Station Eleven", "author_id": "auth_021", "category": "Sci-Fi", "year": 2014, "pages": 333,
     "isbn": "978-0-385-35330-4", "language": "English", "publisher": "Knopf",
     "description": "A flu pandemic devastates civilization in a matter of weeks. Fifteen years later, a travelling symphony performs Shakespeare and classical music to the scattered settlements that dot the Great Lakes region. The narrative moves back and forward in time, tracing a constellation of characters connected by their intersecting paths. A quietly devastating meditation on memory, art, and what it means to be human, made all the more prescient by recent history.",
     "tags": ["Pandemic", "Art", "Memory", "Post-Apocalyptic"], "rating": 4.4},

    {"title": "The Bell Jar", "author_id": "auth_004", "category": "Classic", "year": 1963, "pages": 244,
     "isbn": "978-0-060-97490-6", "language": "English", "publisher": "Heinemann",
     "description": "Esther Greenwood, a brilliant college student, wins a coveted internship at a New York fashion magazine, but as summer advances, she finds herself unable to eat, sleep, or write and descends into a terrifying depression. Sylvia Plath's semi-autobiographical novel is told with a dry, dark wit that makes its descent into madness all the more chilling. One of the defining texts of twentieth-century American literature.",
     "tags": ["Mental Health", "Feminism", "1950s", "Semi-Autobiographical"], "rating": 4.5},

    {"title": "Thinking in Systems", "author_id": "auth_020", "category": "Philosophy", "year": 2008, "pages": 218,
     "isbn": "978-1-603-58055-7", "language": "English", "publisher": "Chelsea Green Publishing",
     "description": "Drawing on Donella Meadows' decades of experience with complex systems, this book provides a concise introduction to systems thinking. From global challenges like climate change and poverty to everyday challenges in personal and organizational life, systems thinking helps us understand the root causes of problems and identify leverage points for change. A foundational text for anyone seeking to understand the interconnected world.",
     "tags": ["Systems", "Ecology", "Feedback Loops", "Complexity"], "rating": 4.5},
]

# ─────────────────────────────────────────────────────────
# GENERATE BOOKS WITH STOCK DATA
# ─────────────────────────────────────────────────────────
def generate_books(templates, authors_lookup):
    books = []
    for i, tmpl in enumerate(templates):
        book_id = f"book_{str(i+1).zfill(3)}"
        total   = random.randint(2, 10)
        avail   = random.randint(0, total)
        price   = round(random.uniform(6.99, 24.99), 2)
        rating  = tmpl.get("rating", round(random.uniform(3.8, 5.0), 1))

        books.append({
            "id":                book_id,
            "title":             tmpl["title"],
            "author_id":         tmpl["author_id"],
            "category":          tmpl["category"],
            "year":              tmpl["year"],
            "pages":             tmpl["pages"],
            "isbn":              tmpl["isbn"],
            "language":          tmpl["language"],
            "publisher":         tmpl["publisher"],
            "description":       tmpl["description"],
            "tags":              tmpl.get("tags", []),
            "rating":            rating,
            "total_copies":      total,
            "available_copies":  avail,
            "price":             price,
            "cover_palette":     i % 12,
            "added_date":        (datetime.now() - timedelta(days=random.randint(0, 730))).isoformat(),
            "borrow_count":      random.randint(0, 200),
            "is_ebook":          random.choice([True, True, False]),
        })

    return books


def update_author_counts(authors, books):
    counts = {}
    for b in books:
        counts[b["author_id"]] = counts.get(b["author_id"], 0) + 1
    for a in authors:
        a["book_count"] = counts.get(a["id"], 0)
    return authors


# ─────────────────────────────────────────────────────────
# USERS
# ─────────────────────────────────────────────────────────
def generate_users():
    return [
        {
            "id":             "user_admin",
            "name":           "Library Admin",
            "email":          "admin@librarium.io",
            "password_hash":  hash_password("admin123"),
            "role":           "admin",
            "avatar_seed":    "admin_user",
            "joined_date":    "2023-01-01T00:00:00",
            "reading_goal":   50,
            "books_read":     12,
            "total_fines":    0.0,
            "active_borrows": []
        },
        {
            "id":             "user_001",
            "name":           "Alex Reed",
            "email":          "alex@example.com",
            "password_hash":  hash_password("password123"),
            "role":           "member",
            "avatar_seed":    "alex_reed",
            "joined_date":    "2023-06-15T00:00:00",
            "reading_goal":   24,
            "books_read":     7,
            "total_fines":    2.50,
            "active_borrows": []
        },
        {
            "id":             "user_002",
            "name":           "Jordan Blake",
            "email":          "jordan@example.com",
            "password_hash":  hash_password("password123"),
            "role":           "member",
            "avatar_seed":    "jordan_blake",
            "joined_date":    "2023-09-20T00:00:00",
            "reading_goal":   12,
            "books_read":     3,
            "total_fines":    0.0,
            "active_borrows": []
        },
    ]


# ─────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────
def main():
    print("📚 Generating Librarium dataset…")

    authors_lookup = {a["id"]: a for a in AUTHORS}
    books = generate_books(BOOK_TEMPLATES, authors_lookup)
    authors_with_counts = update_author_counts(AUTHORS, books)
    users = generate_users()
    transactions = []

    atomic_write(os.path.join(DATA_DIR, "books.json"),        books)
    atomic_write(os.path.join(DATA_DIR, "authors.json"),      authors_with_counts)
    atomic_write(os.path.join(DATA_DIR, "users.json"),        users)
    atomic_write(os.path.join(DATA_DIR, "transactions.json"), transactions)

    print(f"  ✅ {len(books)} books written       → data/books.json")
    print(f"  ✅ {len(authors_with_counts)} authors written    → data/authors.json")
    print(f"  ✅ {len(users)} users written       → data/users.json")
    print(f"  ✅ Transactions (empty)     → data/transactions.json")
    print(f"\n🎉 Dataset ready. Run: python app.py")
    print(f"\nDefault credentials:")
    print(f"  Admin:  admin@librarium.io / admin123")
    print(f"  User:   alex@example.com   / password123")


if __name__ == "__main__":
    main()
