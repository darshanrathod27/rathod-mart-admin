// Advanced Product Icon Mapping
export const getProductIcon = (productName, categoryName = "") => {
  const name = productName.toLowerCase();
  const category = categoryName.toLowerCase();

  // Food & Grocery Products
  if (/\b(rice|grain|cereal|wheat|oats)\b/.test(name)) return "🌾";
  if (/\b(bread|bun|loaf|toast)\b/.test(name)) return "🍞";
  if (/\b(apple|fruit)\b/.test(name)) return "🍎";
  if (/\b(banana)\b/.test(name)) return "🍌";
  if (/\b(orange|citrus)\b/.test(name)) return "🍊";
  if (/\b(grape|wine)\b/.test(name)) return "🍇";
  if (/\b(strawberry|berry)\b/.test(name)) return "🍓";
  if (/\b(melon|watermelon)\b/.test(name)) return "🍉";
  if (/\b(carrot|vegetable)\b/.test(name)) return "🥕";
  if (/\b(potato|aloo)\b/.test(name)) return "🥔";
  if (/\b(tomato)\b/.test(name)) return "🍅";
  if (/\b(egg|anda)\b/.test(name)) return "🥚";
  if (/\b(milk|doodh)\b/.test(name)) return "🥛";
  if (/\b(cheese|paneer)\b/.test(name)) return "🧀";
  if (/\b(meat|chicken|mutton)\b/.test(name)) return "🍖";
  if (/\b(fish|machli|seafood)\b/.test(name)) return "🐟";
  if (/\b(pizza)\b/.test(name)) return "🍕";
  if (/\b(burger|sandwich)\b/.test(name)) return "🍔";
  if (/\b(cake|pastry)\b/.test(name)) return "🍰";
  if (/\b(cookie|biscuit)\b/.test(name)) return "🍪";
  if (/\b(chocolate|candy)\b/.test(name)) return "🍫";
  if (/\b(ice cream|kulfi)\b/.test(name)) return "🍨";
  if (/\b(tea|chai)\b/.test(name)) return "🍵";
  if (/\b(coffee)\b/.test(name)) return "☕";
  if (/\b(juice|soft drink|cola)\b/.test(name)) return "🥤";
  if (/\b(water|pani)\b/.test(name)) return "💧";
  if (/\b(oil|ghee|butter)\b/.test(name)) return "🧈";
  if (/\b(honey|madhu)\b/.test(name)) return "🍯";
  if (/\b(salt|namak|sugar|chini)\b/.test(name)) return "🧂";

  // Personal Care & Beauty
  if (/\b(soap|bathing bar)\b/.test(name)) return "🧼";
  if (/\b(shampoo|hair)\b/.test(name)) return "🧴";
  if (/\b(toothpaste|brush)\b/.test(name)) return "🪥";
  if (/\b(perfume|fragrance)\b/.test(name)) return "🧴";
  if (/\b(lipstick|makeup)\b/.test(name)) return "💄";

  // Baby Products
  if (/\b(diaper|baby)\b/.test(name)) return "👶";
  if (/\b(toy|khilona)\b/.test(name)) return "🧸";

  // Electronics
  if (/\b(phone|mobile|smartphone)\b/.test(name)) return "📱";
  if (/\b(laptop|computer)\b/.test(name)) return "💻";
  if (/\b(tv|television)\b/.test(name)) return "📺";
  if (/\b(camera|photo)\b/.test(name)) return "📷";
  if (/\b(headphone|earphone)\b/.test(name)) return "🎧";
  if (/\b(speaker|audio)\b/.test(name)) return "📻";
  if (/\b(charger|cable)\b/.test(name)) return "🔌";
  if (/\b(battery|power)\b/.test(name)) return "🔋";

  // Clothing & Fashion
  if (/\b(shirt|t-shirt|top)\b/.test(name)) return "👕";
  if (/\b(dress|frock|saree)\b/.test(name)) return "👗";
  if (/\b(jeans|pants|trousers)\b/.test(name)) return "👖";
  if (/\b(shoes|chappal|sandal)\b/.test(name)) return "👟";
  if (/\b(bag|purse|handbag)\b/.test(name)) return "👜";
  if (/\b(watch|ghadi)\b/.test(name)) return "⌚";
  if (/\b(ring|jewelry|ornament)\b/.test(name)) return "💍";

  // Home & Kitchen
  if (/\b(plate|bowl|dish)\b/.test(name)) return "🍽️";
  if (/\b(glass|cup|mug)\b/.test(name)) return "🥤";
  if (/\b(spoon|fork|knife)\b/.test(name)) return "🥄";
  if (/\b(bottle|water bottle)\b/.test(name)) return "🍼";
  if (/\b(lamp|light|bulb)\b/.test(name)) return "💡";
  if (/\b(fan|cooler)\b/.test(name)) return "🌀";
  if (/\b(chair|furniture)\b/.test(name)) return "🪑";
  if (/\b(table|desk)\b/.test(name)) return "🪑";

  // Sports & Fitness
  if (/\b(ball|football|cricket)\b/.test(name)) return "⚽";
  if (/\b(basketball)\b/.test(name)) return "🏀";
  if (/\b(tennis|badminton)\b/.test(name)) return "🎾";

  // Books & Education
  if (/\b(book|kitab|novel)\b/.test(name)) return "📚";
  if (/\b(pen|pencil|marker)\b/.test(name)) return "✏️";
  if (/\b(notebook|diary|copy)\b/.test(name)) return "📓";

  // Health & Medicine
  if (/\b(medicine|tablet|capsule|dawai)\b/.test(name)) return "💊";
  if (/\b(vitamin|supplement)\b/.test(name)) return "💊";
  if (/\b(thermometer|fever)\b/.test(name)) return "🌡️";

  // Category-based fallback
  if (category.includes("grocery") || category.includes("food")) return "🛒";
  if (category.includes("electronics")) return "📱";
  if (category.includes("clothing") || category.includes("fashion"))
    return "👕";
  if (category.includes("beauty") || category.includes("cosmetic")) return "💄";
  if (category.includes("baby")) return "👶";
  if (category.includes("pet")) return "🐕";
  if (category.includes("home")) return "🏠";
  if (category.includes("health")) return "💊";
  if (category.includes("sports")) return "🏀";

  // Default product icon
  return "📦";
};

export const getProductColor = (productName, categoryName = "") => {
  const name = productName.toLowerCase();
  const category = categoryName.toLowerCase();

  // Fresh & Organic
  if (/\b(fresh|organic|natural|pure)\b/.test(name)) return "#4CAF50";

  // Fruits & Vegetables
  if (/\b(fruit|apple|banana|orange|vegetable|carrot|tomato)\b/.test(name))
    return "#4CAF50";

  // Dairy & Beverages
  if (/\b(milk|cheese|yogurt|juice|water|tea|coffee)\b/.test(name))
    return "#2196F3";

  // Meat & Proteins
  if (/\b(meat|chicken|fish|egg|protein)\b/.test(name)) return "#F44336";

  // Bakery & Sweets
  if (/\b(bread|cake|cookie|chocolate|sweet)\b/.test(name)) return "#FF9800";

  // Electronics
  if (/\b(phone|laptop|tv|camera|electronic)\b/.test(name)) return "#9C27B0";

  // Fashion
  if (/\b(shirt|dress|jeans|shoes|fashion|clothing)\b/.test(name))
    return "#E91E63";

  // Health & Beauty
  if (/\b(medicine|vitamin|soap|shampoo|beauty|cosmetic)\b/.test(name))
    return "#00BCD4";

  // Baby Products
  if (/\b(baby|toy|diaper|infant)\b/.test(name)) return "#673AB7";

  // Category-based colors
  if (category.includes("fruit") || category.includes("vegetable"))
    return "#4CAF50";
  if (category.includes("dairy") || category.includes("beverage"))
    return "#2196F3";
  if (category.includes("meat") || category.includes("protein"))
    return "#F44336";
  if (category.includes("bakery") || category.includes("sweet"))
    return "#FF9800";
  if (category.includes("electronics")) return "#9C27B0";
  if (category.includes("fashion") || category.includes("clothing"))
    return "#E91E63";
  if (category.includes("beauty") || category.includes("cosmetic"))
    return "#00BCD4";
  if (category.includes("baby")) return "#673AB7";
  if (category.includes("health")) return "#00BCD4";

  return "#4CAF50"; // Default green
};
