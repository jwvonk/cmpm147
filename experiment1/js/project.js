// project.js - grammar-based Sims Patch Notes genereator
// Authors: Joost Vonk, Wes Modes
// Date: 4/6/2024

function main() {
  const fillers = {
    note: [
      `$modified the urge for $trait Sims to $verb $objects.`,
      `"Become $relationship with $person" wish $frequency appears.`,
      `$person Sims $frequency $transform when "$activity" after "$activity".`,
      `$person Sims $frequency $transform after "$activity".`,
      `$marking is $frequency visible on the $appendages of $person Sims.`,
      `Sims' $objects are $frequency $manipulated in $container when $activity.`,
      `Sims can $frequency $pairActivity with $cryptid.`,
      `$qualifier $person Sims can $frequency be $activity.`,
      `Sims that were turned into $qualifier Sims via $medium will $frequency revert back to human form after $activity in $location.`,
      `Sims $frequency $pairActivity with inappropriate partners in $location.`,
      `There are $frequency stricter requirements to $pairActivity with Sims in $location.`,
    ],
    modified: ["Reduced", "Increased", "Adjusted", "Eliminated", "Enhanced"],
    trait: ["neat", "outgoing", "lazy", "perfectionist", "charismatic"],
    verb: ["put away", "clean", "throw", "collect", "cook"],
    objects: ["fire pits", "fish", "paintings", "books", "garden gnomes"],
    relationship: ["Enemies", "Best Friends", "Soulmates", "Rivals", "Roommates"],
    person: ["Child", "Toddler", "Elder", "Teen", "Young Adult"],
    frequency: ["now", "no longer", "more frequently", "less frequently"],
    transform: ["deform", "spontaneously combust", "shrink", "turn invisible", "grow extra limbs"],
    activity: ["Watching TV", "Learning to Talk", "Watching a Concert", "Moving Homes", "Cooking Dinner"],
    marking: ["A faint line", "An unusual symbol", "A mysterious tattoo", "A glowing aura", "A sparkling trail"],
    appendages: ["heads", "arms", "legs", "torso", "buttocks"],
    manipulated: ["duplicated", "transmuted", "teleported", "shrunk", "enlarged"],
    container: ["fridge", "backpack", "mailbox", "garbage can", "treasure chest"],
    pairActivity: ["Try for Baby", "WooHoo", "Cuddle", "Flirt", "Exchange Gifts"],
    cryptid: ["the Grim Reaper", "Bigfoot", "Nessie", "Chupacabra", "Mothman"],
    qualifier: ["Mermaid", "Vampire", "Werewolf", "Alien", "Zombie", "SimBot"],
    medium: ["an elixir", "a magical spell", "a mysterious ritual", "a scientific experiment", "a curse"],
    location: ["tents", "the Sarcophagus", "a haunted house", "an alien spaceship", "the depths of the ocean"],
  };
  
  const template = `$note\n\n$note\n\n$note\n\n$note\n\n$note`;
  
  // STUDENTS: You don't need to edit code below this line.
  
  const slotPattern = /\$(\w+)/;
  
  function replacer(match, name) {
    let options = fillers[name];
    if (options) {
      return options[Math.floor(Math.random() * options.length)];
    } else {
      return `<UNKNOWN:${name}>`;
    }
  }
  
  function generate() {
    let story = template;
    while (story.match(slotPattern)) {
      story = story.replace(slotPattern, replacer);
    }
  
    /* global box */
    $("#box").text(story);
  }
  
  /* global clicker */
  $("#clicker").click(generate);
  
  generate(); 
}

main();