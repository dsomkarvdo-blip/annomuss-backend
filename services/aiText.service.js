export const generatePoeticText = async (emotion) => {
  const templates = {
    sad: "Some days feel heavier than words can carry.",
    lonely: "Surrounded by people, yet alone inside.",
    anxious: "My heart runs faster than my thoughts.",
    happy: "Today, my soul smiled quietly."
  };

  return templates[emotion] || "Feelings flow without names.";
};