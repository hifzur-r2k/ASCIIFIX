const TrainingDataHelper = require('../utils/trainingDataHelper');

// 🤖 ALL YOUR 20 AI EXAMPLES (Complete List)
const aiExamples = [
  "The Periodic Table: The Master Key to Chemistry The periodic table is not merely a chart of elements; it is one of the most powerful and elegant organizing principles in all of science. It is a systematic and predictive map of all the fundamental building blocks of matter, arranged to reveal the hidden patterns that govern their behavior. Its development and structure provide the essential framework for understanding chemistry, physics, biology, and material science. The Philosophical Idea: From Chaos to Order Before the mid-19th century, chemistry was a field crowded with disconnected facts. Scientists had discovered over 60 elements but had no clear system to relate them. The genius of the periodic table began with the realization that there must be an underlying order. Prediction: He had the courage to leave gaps for elements that had not yet been discovered and even predicted their properties with remarkable accuracy. The subsequent discovery of elements like gallium, germanium, and scandanium, which fit his predictions perfectly, validated his table and cemented its legacy. The table's structure is a direct reflection of the quantum mechanical structure of atoms.",

  "India's Geography: A Subcontinent of Staggering Diversity India's geography is a story of dramatic contrasts and immense diversity, earning it the classification of a subcontinent. Its landscape is a grand tapestry woven from towering mountain ranges, vast fertile plains, arid deserts, lush plateaus, and a long, biodiverse coastline. This physical variety has profoundly shaped the nation's climate, history, culture, and economic life. The Great Mountain Wall: The Himalayas In the far north, the majestic Himalayan mountain range acts as a formidable and defining natural barrier. Formed by the tectonic collision of the Indian Plate with the Eurasian Plate, these young, fold mountains are the highest in the world. South of the Himalayas lie the expansive Northern Plains, formed by the alluvial deposits of the Indus, Ganges, and Brahmaputra river systems. This region is one of the most fertile and densely populated areas on Earth. The rivers are not just sources of water for irrigation and drinking; they are deeply sacred in Indian culture. The plains are the nation's agricultural heartland, producing vast quantities of food grains like wheat, rice, and sugarcane, which support both India's massive population and its economy.",

  "Medieval Architecture: Stone, Faith, and Power Medieval architecture, spanning roughly from the 5th to the late 15th century, is far more than a mere historical style. It is a physical manifestation of the era's profound faith, feudal hierarchy, and technological ingenuity. Evolving over a millennium, it tells a story of societal collapse, religious fervor, and the gradual shift towards humanism, primarily through two dominant styles: Romanesque and Gothic. The Romanesque: Fortresses of God (c. 1000-1150 AD) Following the chaos of the Early Middle Ages, the Romanesque style emerged as Europe began to stabilize. ",

  "Whales: The Gentle Giants Engineered for a Healthy Planet Whales, the majestic leviathans of the deep, have long captured human imagination. For centuries, they were viewed primarily as a resource—hunted for their oil, meat, and bone. However, modern science has unveiled a far more significant and inspiring truth: whales are not just inhabitants of the ocean; they are fundamental engineers of their ecosystem. Their existence, behavior, and even their deaths create a delicate cycle that sustains marine life, fights climate change, and supports the entire planetary system.",

  "Elephants are often described as having one of the most extraordinary senses of smell in the animal kingdom. Their ability to detect water sources from miles away has fascinated scientists, naturalists, and local communities who live alongside them. This capability is not just a curious trait; it is a critical survival mechanism in the often harsh and dry environments where elephants live. Understanding how elephants achieve this requires looking into their anatomy, evolutionary adaptations, and behavioral strategies.",

  "The theory of evolution is a scientific explanation for how life on Earth has developed and diversified over time. It is most closely associated with Charles Darwin, who in 1859 published On the Origin of Species. Darwin proposed that all living organisms share common ancestry and that the diversity of life arose through a gradual process of change. The key mechanism he identified is natural selection, where individuals with traits better suited to their environment are more likely to survive, reproduce, and pass on those traits to the next generation.",

  "Renewable energy refers to energy that is derived from natural sources which are constantly replenished, such as sunlight, wind, water, and biomass. Unlike fossil fuels, which are finite and produce harmful emissions, renewable energy is sustainable and environmentally friendly. The growing demand for energy, combined with the urgent need to address climate change, has made renewable energy an essential focus for the future. One of the most common forms of renewable energy is solar power, which uses panels to capture sunlight and convert it into electricity.",

  "The history between Britain and India is a complex and transformative period, primarily defined by British colonial rule, known as the British Raj. This era began with the establishment of the British East India Company in 1600, which initially sought trade but gradually expanded its political influence as the Mughal Empire declined. Following the decisive Battle of Plassey in 1757, the company became the dominant power in Bengal, a critical first step toward controlling the subcontinent.",

  "The history of currency is a fascinating journey that has evolved over thousands of years, moving from simple barter to complex digital systems. Before the invention of money, societies relied on the barter system, directly exchanging goods and services. While this worked for small, local communities, its limitations became apparent as trade expanded, as it required a 'double coincidence of wants'—both parties had to possess something the other desired.",

  "The barter system is a method of exchange where goods or services are directly traded for other goods or services without the use of a medium of exchange, like money. It's the oldest form of commerce, dating back to ancient times, and relies on a double coincidence of wants, meaning both parties involved in the trade must have something the other wants and be willing to exchange it. This system is characterized by its simplicity but also presents several challenges.",

  "A wormhole, or an Einstein-Rosen bridge, is a theoretical shortcut through the fabric of spacetime that could connect two distant points in the universe. This concept stems directly from Albert Einstein's theory of general relativity, which describes how massive objects curve spacetime. Imagine a flat sheet of paper representing the universe; two points on opposite sides are far apart. By folding the paper so the two points touch, a wormhole would be the tunnel that connects them, allowing for travel in a fraction of the time.",

  "Organic chemistry is the branch of chemistry that focuses on the scientific study of carbon-containing compounds. Originally, the term 'organic' was coined because these compounds were believed to be exclusively produced by living organisms, but this limitation was debunked when Friedrich Wöhler synthesized urea from inorganic substances. The field centers around carbon's unique properties, particularly its ability to form very stable covalent bonds with other carbon atoms—a property called catenation.",

  "Python is the most popular and versatile programming language for ethical hacking, serving as the foundation for penetration testing, exploit development, and security automation. Its simplicity and extensive security libraries like Scapy, Requests, and Paramiko make it essential for network security scripts, malware analysis, and forensics tools. JavaScript is crucial for web security professionals, enabling ethical hackers to manipulate front-end and back-end web components, test web applications, and identify vulnerabilities like cross-site scripting (XSS).",

  "Reconnaissance algorithms form the foundation of ethical hacking, using network scanning techniques like Nmap for port discovery and Whois lookup for domain information gathering. These algorithms systematically collect data through active scanning and passive footprinting to map target infrastructure. SQL injection algorithms exploit database vulnerabilities by inserting malicious SQL code through input fields to access unauthorized data.",

  "Wireless keyboards operate using radio frequency (RF) technology or Bluetooth to transmit keystrokes without physical cables. Most modern wireless keyboards work on 2.4 GHz radio frequency, providing stable connections with minimal interference. The system consists of two essential components: a transmitter inside the keyboard and a receiver that connects to the computer. When you press a key, the keyboard's internal transmitter converts the keystroke into an electrical signal, then into a digital data packet that is transmitted via radio waves to the receiver.",

  "Breaking Bad is an American crime drama series created by Vince Gilligan, following the transformation of Walter White from a humble high school chemistry teacher into a ruthless drug kingpin. The story begins when Walter, living in Albuquerque with his wife Skyler and son Walter Jr., learns he has terminal lung cancer. Desperate to secure his family's financial future, he partners with former student Jesse Pinkman to cook and sell high-quality crystal meth.",

  "Size and Strength: Polar Bear: Adult males can weigh 450–700 kg (even more in some cases) and stand over 10 feet tall when on hind legs. They have immense bulk, stamina, and one of the strongest forelimbs among land predators. Tiger: The Siberian (Amur) tiger, the largest subspecies, averages 220–320 kg, with some reaching around 350 kg. Tigers are leaner, more agile, and have a powerful bite and deadly claws. Fighting Style: Polar Bear: Built for endurance and brute force.",

  "Stars appear to blink or twinkle (a effect astronomers call scintillation) because of Earth's atmosphere, not because of anything the stars themselves are doing. Here's a simple breakdown of why it happens: Starlight Has to Travel Through Air: The light from a star has spent years traveling in a straight line through the vacuum of space. But before it can reach your eye, it must pass through Earth's atmosphere.",

  "Achieving miniature versions of huge plants, most commonly seen in bonsai and the cultivation of dwarf varieties, is a combination of several techniques. It's not about stunting a plant's growth in an unhealthy way, but rather about carefully controlling its environment and form to create a healthy, miniature version. Here's a breakdown of the main methods: 1. Genetic Selection: The Foundation This is the most straightforward method. Horticulturists selectively breed plants to favor genes that result in a naturally smaller size.",

  "Alexander Graham Bell invented the first practical telephone through a remarkable combination of scientific curiosity, personal motivation, and technological breakthrough that forever changed human communication. Background and Motivation Bell's journey began with deeply personal circumstances that shaped his life's work. Born in Edinburgh in 1847, he came from a family dedicated to speech and elocution—his father and grandfather were both renowned teachers of speech training."
];

// 👤 ALL YOUR 20 HUMAN EXAMPLES (Complete List)
const humanExamples = [
  "When I'm making small talk at parties and suchlike, revealing to others that I'm a philosopher of physics is a little bit like rolling the dice. What reaction am I going to get? The range is pretty broad, from 'What does philosophy have to do with physics?' to 'Oh, that's way above my pay grade!' to (on happier occasions) 'That sounds amazing, tell me more!' to (on less happy occasions) 'What a waste of taxpayer's money! You should be doing engineering instead!' Only the last of these responses is downright stupid, but otherwise the range of reactions is perfectly reasonable and understandable.",

  "When our planet was newly formed, the story goes, the surface was a barren wasteland of sharp rocks, strewn with lava flows from erupting volcanoes. The air was an unbreathable fume of gases. There was little or no liquid water. Just as things were starting to settle down, a barrage of meteorites tens of kilometres across came pummelling down from space, obliterating entire landscapes and sending vast plumes of debris high into the sky. This barren world persisted for hundreds of millions of years.",

  "At 8:30 am sharp, a white van pulls up to Boone Hall, where the Outsiders are huddled in their black shirts, sleepy-faced, but in good spirits. They pile in quickly, knowing we have to stick to a tight schedule. A 10-minute drive from campus, and the van pulls up under the arch of a large metal gate crowned with razor wire. By 8:45, the Outsiders are standing in line, placing their possessions in plastic bins and waiting for the no-nonsense guards to pat them down and rifle through their things.",

  "Thermodynamics is a branch of Physics that explains how thermal energy is changed to other forms of energy and the significance of thermal energy in matter. The behavior of heat, work, and temperature, along with their relations to energy and entropy are governed by the Four Laws of Thermodynamics. Thermodynamics is the study of relations between heat, work, temperature, and energy, focusing on the laws that govern the transformation of energy within a system and its capability to perform work in its environment.",

  "A wave is a disturbance in a medium that transports energy without causing net particle movement. Elastic deformation, pressure variations, electric or magnetic intensity, electric potential, or temperature variations are all examples. Characteristics of Waves: Waves include the following characteristics: The particles of the medium traversed by a wave vibrate only slightly about their mean positions, but they are not permanently displaced in the wave's propagation direction.",

  "The cytoplasm is all the material within a eukaryotic or prokaryotic cell, enclosed by the cell membrane, including the organelles and excluding the nucleus in eukaryotic cells. The material inside the nucleus of a eukaryotic cell and contained within the nuclear membrane is termed the nucleoplasm. The main components of the cytoplasm are the cytosol (a gel-like substance), the cell's internal sub-structures, and various cytoplasmic inclusions.",

  "At 8.15 on the morning of 6th August 1945, the Japanese city of Hiroshima was devastated by the first atomic bomb to be used as a weapon of war. The bomb, nicknamed 'Little Boy', was dropped from the USAAF B29 bomber 'Enola Gay' and exploded some 1,800 feet above the city. Delivering the equivalent of around 12.5 kilotons of TNT, the bomb reduced 5 square miles of the city centre to ashes and caused the deaths of an estimated 120,000 people within the first four days following the blast.",

  "A dramatic reading of a real-life conversation between Jo Berry, daughter of Sir Anthony Berry, killed in the 1984 Grand Hotel Brighton bombing, and Pat McGee, a member of the IRA who was responsible for the attack. Since his release in 1999, Jo and Pat have met on more than 200 occasions. Although Pat carries the burden of knowing he had caused Jo profound hurt, they continue to explore their common humanity, recognising that war robs combatants of what it is to be human.",

  "What Is an Adjective? An adjective is a part of speech that can be used to describe or provide more information about a noun or pronoun that acts as the subject in a sentence. Adjectives are found after the verb or before the noun it modifies. Definition of an Adjective According to the Cambridge Dictionary, an adjective is defined as 'a word that describes a noun or pronoun.' The Collins Dictionary gives a more elaborate definition.",

  "Estate planning and elder law are two distinct but related areas of law that address what happens near the end of a person's life and after their death. Both areas of law help ensure that an individual's personal affairs are taken care of and that their loved ones are provided for. 'There isn't necessarily a definition of elder law that applies to every attorney who practices in the area,' says Virginia elder law attorney Ann McGee Green.",

  "J.K. Rowling (born July 31, 1965, Yate, near Bristol, England) is a British author and the creator of the popular and critically acclaimed Harry Potter series, about a young sorcerer in training. Humble beginnings After graduating from the University of Exeter in 1986, Rowling began working for Amnesty International in London, where she started to write the Harry Potter adventures. In the early 1990s she traveled to Portugal to teach English as a foreign language.",

  "In Simple way we can say that cyber crime is unlawful acts wherein the computer is either a tool or a target or both. Cyber crimes can involve criminal activities that are traditional in nature, such as theft, fraud, forgery, defamation and mischief, all of which are subject to the Indian Penal Code. The abuse of computers has also given birth to a gamut of new age crimes that are addressed by the Information Technology Act, 2000.",

  "The Government of every country is responsible for the formulation of traffic rules that must be followed by the citizens of a country. In the Indian context, the Government of India is responsible for conceptualizing traffic laws and ensuring compliance by Indian citizens. In India, the Motor Vehicles Act, 1988, recently amended by way of the Motor Vehicles (Amendment) Act, 2019, governs the rules, regulations, penalties, and other stipulations regarding vehicles and traffic in India.",

  "Heisenberg went to the Maximilian school at Munich until 1920, when he went to the University of Munich to study physics under Sommerfeld, Wien, Pringsheim, and Rosenthal. During the winter of 1922-1923 he went to Göttingen to study physics under Max Born, Franck, and Hilbert. In 1923 he took his Ph.D. at the University of Munich and then became Assistant to Max Born at the University of Göttingen, and in 1924 he gained the venia legendi at that University.",

  "Germany's resumption of submarine attacks on passenger and merchant ships in 1917 became the primary motivation behind Wilson's decision to lead the United States into World War I. Following the sinking of an unarmed French boat, the Sussex, in the English Channel in March 1916, Wilson threatened to sever diplomatic relations with Germany unless the German Government refrained from attacking all passenger ships and allowed the crews of enemy merchant vessels to abandon their ships prior to any attack.",

  "Why Do Stars Twinkle? When a ray of light travels from one medium to another it 'bends'. This phenomenon is referred to as refraction. If it travels from a rare medium to a dense medium, it bends towards the normal and if it travels from a dense medium to a rarer medium, it bends away from the normal. The speed at which the light travels changes depending on the medium and therefore this bending occurs.",

  "The loanword bonsai has become an umbrella term in English, attached to many forms of diminutive potted plants, and also on occasion to other living and non-living things. According to Stephen Orr in The New York Times, 'in the West, the word is used to describe virtually all miniature container trees, whether they are authentically trained bonsai or just small rooted cuttings. Technically, though, the term should be reserved for plants that are grown in shallow containers following the precise tenets of bonsai pruning and training.'",

  "Vasco da Gama was a Portuguese explorer, the first person to sail directly from Europe to India, and one of the most influential in the European Age of Exploration. Commissioned to find Christian lands in the East by King Manuel I of Portugal (the king, was under the impression that India was the mythical Christian kingdom of Prester John) and to obtain Portuguese access to the commercial markets of the Orient, Vasco da Gama expanded the discovery of the sea route of his predecessor, Bartolomeu Dias.",

  "The sound of God's voice created life, in Christian understanding. In the womb, sound is the first of the senses to apprehend the world beyond the body: a fetus is able to hear their mother's voice, while a chick in the egg hears the song of its parent birds. Hearing is thought to be the last sense to leave us in our dying, and we speak of the silence of the grave. Healing has traditionally been associated with sound, from the psychological medicine of a lullaby to the chants of monks and nuns in the early hospitals of monasteries.",

  "when my relationship of 17 years ended in divorce, I felt alone in the world in a way so yawning I couldn't sit still, it was like living beneath a cold and blinding sun. I drank. I said cruel things to myself. I craved but hated all the sympathy. Finally, newly ensconced on the coast of Portugal, I picked up a surfboard. The water was cold. My early attempts were so pathetic I laughed out loud, imagining how I must have looked from the sand. But I went back, and kept going back, and now I will never stop."
];

// 🎯 INTELLIGENT SIGNAL GENERATOR  
function generateSignals(text, label) {
  const signals = [];
  
  // Check for AI patterns
  if (/\b(furthermore|moreover|additionally|consequently|therefore|thus|hence)\b/i.test(text)) {
    signals.push('formal transitions');
  }
  if (/\b(comprehensive|systematic|fundamental|significant|essential|critical|various|numerous)\b/i.test(text)) {
    signals.push('academic language');
  }
  if (/\b(analysis|implementation|integration|optimization|methodology|characteristics|principles)\b/i.test(text)) {
    signals.push('technical terminology');
  }
  if (text.length > 400 && /\.\s+[A-Z]/.test(text)) {
    signals.push('structured paragraphs');
  }
  
  // Check for human patterns  
  if (/\b(I|my|me|personally|honestly|when I|I'm)\b/i.test(text)) {
    signals.push('personal voice');
  }
  if (/\b(wow|amazing|shocked|can't believe|honestly|suchlike)\b/i.test(text)) {
    signals.push('emotional expressions');
  }
  if (/'|\bdon't\b|\bcan't\b|\bit's\b|\bwon't\b/.test(text)) {
    signals.push('contractions');
  }
  if (/\b(story goes|sharp|huddled|pile in)\b/i.test(text)) {
    signals.push('narrative style');
  }
  
  // Default signals based on label
  if (signals.length === 0) {
    if (label === 'AI') {
      signals.push('generic academic tone', 'formal structure');
    } else {
      signals.push('natural flow', 'authentic voice');
    }
  }
  
  return signals.slice(0, 3).join(', ');
}

// 🎯 INTELLIGENT EXPLANATION GENERATOR
function generateExplanation(signals, label) {
  if (label === 'AI') {
    if (signals.includes('formal transitions')) {
      return 'Uses formal academic transitions and structured presentation typical of AI writing';
    } else if (signals.includes('technical terminology')) {
      return 'Employs technical language and systematic approach characteristic of AI content';
    } else if (signals.includes('academic language')) {
      return 'Shows academic vocabulary and formal tone patterns typical of AI-generated text';
    } else {
      return 'Displays formal academic style and structured presentation patterns of AI-generated text';
    }
  } else {
    if (signals.includes('personal voice')) {
      return 'Shows authentic personal perspective and individual voice characteristic of human writing';
    } else if (signals.includes('emotional expressions')) {
      return 'Contains genuine emotional expressions and personal reactions typical of human authors';
    } else if (signals.includes('narrative style')) {
      return 'Uses natural storytelling and descriptive language typical of human authors';
    } else {
      return 'Demonstrates natural human writing patterns with authentic voice and personal touch';
    }
  }
}

// 🚀 MAIN EXECUTION FUNCTION
async function fillTrainingData() {
  console.log('🚀 Starting to fill training data with ALL your examples...\n');
  
  const helper = new TrainingDataHelper();
  await helper.init();
  
  let successCount = 0;
  
  // Process ALL AI examples
  console.log('🤖 Processing ALL 20 AI examples...');
  for (let i = 0; i < aiExamples.length; i++) {
    try {
      const text = aiExamples[i];
      const signals = generateSignals(text, 'AI');
      const explanation = generateExplanation(signals, 'AI');
      
      await helper.addExample({
        text: text,
        label: 'AI',
        confidence: 'High',
        signals: signals,
        explanation: explanation
      });
      
      successCount++;
      // Small delay to ensure unique IDs
      await new Promise(resolve => setTimeout(resolve, 10));
      
    } catch (error) {
      console.error(`❌ Error processing AI example ${i + 1}:`, error.message);
    }
  }
  
  // Process ALL Human examples
  console.log('\n👤 Processing ALL 20 Human examples...');
  for (let i = 0; i < humanExamples.length; i++) {
    try {
      const text = humanExamples[i];
      const signals = generateSignals(text, 'Human');
      const explanation = generateExplanation(signals, 'Human');
      
      await helper.addExample({
        text: text,
        label: 'Human', 
        confidence: 'High',
        signals: signals,
        explanation: explanation
      });
      
      successCount++;
      // Small delay to ensure unique IDs
      await new Promise(resolve => setTimeout(resolve, 10));
      
    } catch (error) {
      console.error(`❌ Error processing Human example ${i + 1}:`, error.message);
    }
  }
  
  // Get final statistics
  const stats = await helper.getStats();
  
  console.log('\n🎉 TRAINING DATA SUCCESSFULLY FILLED!');
  console.log('═══════════════════════════════════════');
  console.log(`📊 Total examples processed: ${successCount}`);
  console.log(`📈 Final statistics:`);
  console.log(`   🤖 AI examples: ${stats.ai}`);
  console.log(`   👤 Human examples: ${stats.human}`);  
  console.log(`   ⭐ High confidence: ${stats.highConfidence}`);
  console.log(`   📁 Total in CSV: ${stats.total}`);
  console.log('═══════════════════════════════════════');
  
  if (stats.total === 40 && Math.abs(stats.ai - stats.human) <= 1) {
    console.log('✅ PERFECT! Your training data is balanced and ready!');
    console.log('🚀 Next step: Run verification with: node src/test/verifyTrainingData.js');
  } else {
    console.log('⚠️  Check your data - something might be missing');
  }
}

// Run the script
fillTrainingData().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
