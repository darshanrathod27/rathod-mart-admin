// Advanced Emoji Icon Mapping for Categories with Extensive Keyword Coverage
export const getCategoryIcon = (categoryName) => {
  const name = categoryName.toLowerCase();

  // Food & Grocery Categories
  if (
    /\b(grocery|groceries|supermarket|market|food|general store|mart)\b/.test(
      name
    )
  )
    return "🛒";
  if (
    /\b(bakery|bread|cake|pastry|baking|dessert|cookies|muffin|croissant)\b/.test(
      name
    )
  )
    return "🍞";
  if (
    /\b(fruit|apple|banana|orange|berry|melon|mango|grape|citrus|tropical)\b/.test(
      name
    )
  )
    return "🍎";
  if (
    /\b(vegetable|veggie|carrot|spinach|broccoli|organic|greens|salad|fresh produce)\b/.test(
      name
    )
  )
    return "🥕";
  if (
    /\b(beverage|drink|juice|cola|soda|tea|coffee|water|soft drink|energy drink)\b/.test(
      name
    )
  )
    return "🥤";
  if (/\b(dairy|milk|cheese|yogurt|butter|cream|ice cream)\b/.test(name))
    return "🥛";
  if (
    /\b(meat|seafood|fish|chicken|pork|beef|bacon|mutton|lamb|turkey)\b/.test(
      name
    )
  )
    return "🍖";
  if (
    /\b(snack|chips|fast food|cookie|candy|popcorn|crackers|nuts)\b/.test(name)
  )
    return "🍿";
  if (/\b(frozen|ice cream|sweet|dessert|chocolate)\b/.test(name)) return "🍨";
  if (/\b(spice|masala|condiment|sauce|seasoning)\b/.test(name)) return "🌶️";
  if (/\b(cereal|grain|rice|wheat|oats|breakfast)\b/.test(name)) return "🌾";

  // Health & Wellness
  if (
    /\b(health|medicine|supplement|pharmacy|vitamin|wellness|medical|drug)\b/.test(
      name
    )
  )
    return "💊";
  if (
    /\b(beauty|cosmetic|makeup|skin|skincare|perfume|hair|personal care)\b/.test(
      name
    )
  )
    return "💄";
  if (/\b(fitness|gym|exercise|sports equipment|workout)\b/.test(name))
    return "💪";

  // Age Groups
  if (/\b(baby|infant|toddler|newborn|child care)\b/.test(name)) return "👶";
  if (/\b(kid|child|children|toys|games|play)\b/.test(name)) return "🧸";
  if (/\b(teen|teenager|youth|student)\b/.test(name)) return "🎒";

  // Animals & Pets
  if (/\b(pet|animal|dog|puppy|canine)\b/.test(name)) return "🐕";
  if (/\b(cat|kitten|feline)\b/.test(name)) return "🐱";
  if (/\b(bird|parrot|pet bird)\b/.test(name)) return "🐦";
  if (/\b(fish|aquarium|aquatic)\b/.test(name)) return "🐠";

  // Home & Living
  if (
    /\b(home|house|furniture|decor|appliance|kitchen|living|iot)\b/.test(name)
  )
    return "🏠";
  if (/\b(garden|plant|flower|outdoor|lawn|landscaping)\b/.test(name))
    return "🌱";
  if (/\b(cleaning|detergent|soap|household|maintenance)\b/.test(name))
    return "🧽";
  if (/\b(bathroom|toilet|hygiene|bath)\b/.test(name)) return "🚿";

  // Education & Books
  if (
    /\b(book|education|library|school|stationery|study|learning)\b/.test(name)
  )
    return "📚";
  if (/\b(office|supplies|pen|paper|notebook|desk)\b/.test(name)) return "📝";

  // Electronics & Technology
  if (/\b(electronic|gadget|phone|mobile|smartphone|wearable)\b/.test(name))
    return "📱";
  if (/\b(computer|laptop|pc|tech|software)\b/.test(name)) return "💻";
  if (/\b(camera|photography|photo|video)\b/.test(name)) return "📷";
  if (/\b(gaming|games|console|playstation|xbox)\b/.test(name)) return "🎮";
  if (/\b(audio|music|headphone|speaker|sound)\b/.test(name)) return "🎧";
  if (/\b(tv|television|entertainment|media)\b/.test(name)) return "📺";

  // Fashion & Clothing
  if (
    /\b(clothing|fashion|apparel|dress|shirt|pants|men's|women's)\b/.test(name)
  )
    return "👗";
  if (/\b(footwear|shoes|sneaker|boot|sandal)\b/.test(name)) return "👟";
  if (/\b(bag|purse|handbag|backpack|luggage)\b/.test(name)) return "👜";
  if (/\b(jewelry|watch|accessory|ring|necklace)\b/.test(name)) return "💍";

  // Transportation
  if (/\b(auto|car|vehicle|automotive|automobile)\b/.test(name)) return "🚗";
  if (/\b(motorcycle|bike|scooter|two wheeler)\b/.test(name)) return "🏍️";
  if (/\b(bicycle|cycle|pedal)\b/.test(name)) return "🚲";
  if (/\b(travel|tourism|vacation|holiday)\b/.test(name)) return "✈️";

  // Sports & Recreation
  if (/\b(sports|sport|athletic|ball|cricket|football|outdoor)\b/.test(name))
    return "🏀";
  if (/\b(toy|game|puzzle|board game|entertainment)\b/.test(name)) return "🧩";
  if (/\b(music|instrument|guitar|piano|singing)\b/.test(name)) return "🎵";

  // Services & Professional
  if (/\b(restaurant|cafe|dining|food service|kitchen & dining)\b/.test(name))
    return "🍽️";
  if (/\b(hotel|accommodation|hospitality|resort)\b/.test(name)) return "🏨";
  if (/\b(banking|finance|money|payment|atm)\b/.test(name)) return "💰";
  if (/\b(medical|hospital|clinic|doctor|healthcare)\b/.test(name)) return "🏥";

  // Seasonal & Special
  if (/\b(gift|present|celebration|party|festival)\b/.test(name)) return "🎁";
  if (/\b(wedding|marriage|ceremony|bridal)\b/.test(name)) return "💒";
  if (/\b(birthday|anniversary|special occasion)\b/.test(name)) return "🎂";

  // Industrial & Business
  if (/\b(tool|hardware|repair|construction|diy)\b/.test(name)) return "🔧";
  if (/\b(business|office|corporate|professional)\b/.test(name)) return "💼";
  if (/\b(agriculture|farming|farm|rural)\b/.test(name)) return "🚜";

  // Default fallback emoji
  return "✨";
};

export const getCategoryColor = (categoryName) => {
  const name = categoryName.toLowerCase();

  // Color mapping based on category types
  if (
    /\b(fruit|apple|banana|berry|mango|organic|fresh|green|vegetable)\b/.test(
      name
    )
  )
    return "#4CAF50"; // Green
  if (/\b(bakery|bread|cake|pastry|dessert|orange|citrus)\b/.test(name))
    return "#FF9800"; // Orange
  if (/\b(beverage|drink|juice|soda|tea|water|blue)\b/.test(name))
    return "#2196F3"; // Blue
  if (/\b(meat|seafood|fish|red|spicy)\b/.test(name)) return "#F44336"; // Red
  if (/\b(dairy|milk|cheese|purple|grape)\b/.test(name)) return "#9C27B0"; // Purple
  if (/\b(health|medicine|pharmacy|medical|wellness)\b/.test(name))
    return "#00BCD4"; // Cyan
  if (/\b(beauty|cosmetic|makeup|skin|pink|fashion)\b/.test(name))
    return "#E91E63"; // Pink
  if (/\b(baby|kid|child|toddler|toys)\b/.test(name)) return "#673AB7"; // Deep Purple
  if (/\b(pet|animal|dog|cat|brown)\b/.test(name)) return "#795548"; // Brown
  if (/\b(home|furniture|decor|appliance|garden|house)\b/.test(name))
    return "#607D8B"; // Blue Grey
  if (/\b(book|education|library|school|stationery|office)\b/.test(name))
    return "#3F51B5"; // Indigo
  if (/\b(electronic|gadget|phone|computer|laptop|camera|tech)\b/.test(name))
    return "#009688"; // Teal
  if (/\b(clothing|apparel|shirt|pants|dress|footwear)\b/.test(name))
    return "#FF5722"; // Deep Orange
  if (/\b(auto|car|vehicle|motorcycle|bike|transport)\b/.test(name))
    return "#795548"; // Brown
  if (/\b(sports|toy|game|fitness|exercise|recreation)\b/.test(name))
    return "#FFC107"; // Amber
  if (/\b(tool|hardware|construction|industrial)\b/.test(name))
    return "#9E9E9E"; // Grey
  if (/\b(gift|celebration|party|wedding|special)\b/.test(name))
    return "#E91E63"; // Pink

  // Default green color
  return "#4CAF50";
};

// Helper function to get category suggestions based on partial input
export const getCategorySuggestions = (partialName) => {
  const suggestions = [
    "Groceries",
    "Fresh Fruits",
    "Vegetables & Greens",
    "Bakery Items",
    "Beverages",
    "Dairy Products",
    "Meat & Seafood",
    "Snacks & Confectionery",
    "Health & Wellness",
    "Beauty & Personal Care",
    "Baby Care",
    "Pet Supplies",
    "Home & Kitchen",
    "Electronics & Gadgets",
    "Fashion & Clothing",
    "Sports & Fitness",
    "Books & Education",
    "Automotive",
    "Garden & Outdoor",
  ];

  if (!partialName) return suggestions.slice(0, 5);

  const filtered = suggestions.filter((suggestion) =>
    suggestion.toLowerCase().includes(partialName.toLowerCase())
  );

  return filtered.slice(0, 8);
};

// Function to get category metadata
export const getCategoryMetadata = (categoryName) => {
  return {
    icon: getCategoryIcon(categoryName),
    color: getCategoryColor(categoryName),
    suggestions: getCategorySuggestions(categoryName),
  };
};
