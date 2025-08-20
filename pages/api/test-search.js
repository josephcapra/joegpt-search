body: JSON.stringify({
  filter: {
    geography: { county: "Martin", cities: ["Stuart"] },
    price: { min: 300000, max: 600000 }
  }
})
