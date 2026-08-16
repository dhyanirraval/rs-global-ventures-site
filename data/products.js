window.RSGV_PRODUCTS = [
  // Vegetables
  { id:'cat-vegetables', type:'category', parentId:null, name:'Vegetables', tag:'Fresh Indian produce', description:'Fresh Indian vegetables sourced for export requirements, subject to season and availability.', image:'/assets/categories/vegetables.jpg' },
  { id:'veg-onion', type:'product', parentId:'cat-vegetables', name:'Fresh Onion', tag:'Vegetables', description:'Indian fresh onions suitable for wholesale and export enquiries. Packing and grade can be discussed based on destination requirements.', image:'/assets/products/veg-onion.jpg' },
  { id:'veg-potato', type:'product', parentId:'cat-vegetables', name:'Fresh Potato', tag:'Vegetables', description:'Indian potatoes for bulk sourcing and export enquiries, with packing and specifications aligned to buyer requirements.', image:'/assets/products/veg-potato.jpg' },
  { id:'veg-garlic', type:'product', parentId:'cat-vegetables', name:'Fresh Garlic', tag:'Vegetables', description:'Indian garlic available for bulk sourcing enquiries, subject to season, grade and destination requirements.', image:'/assets/products/veg-garlic.jpg' },
  { id:'veg-ginger', type:'product', parentId:'cat-vegetables', name:'Fresh Ginger', tag:'Vegetables', description:'Indian fresh ginger for wholesale and export enquiries with buyer-specific packing options.', image:'/assets/products/veg-ginger.webp' },

  // Cereals
  { id:'cat-cereals', type:'category', parentId:null, name:'Cereals', tag:'Indian grains', description:'Indian grains and rice products for international buyers, with specifications and packing tailored to the enquiry.', image:'/assets/categories/cereals.jpg' },
  { id:'cer-basmati', type:'product', parentId:'cat-cereals', name:'Basmati Rice', tag:'Cereals', description:'Indian Basmati rice for export enquiries. Grade, grain specification, packing and shipment requirements can be discussed.', image:'/assets/products/cer-basmati.webp' },
  { id:'cer-nonbasmati', type:'product', parentId:'cat-cereals', name:'Non-Basmati Rice', tag:'Cereals', description:'Indian non-Basmati rice for bulk sourcing and export requirements, subject to availability and buyer specifications.', image:'/assets/products/cer-nonbasmati.jpg' },
  { id:'cer-wheat', type:'product', parentId:'cat-cereals', name:'Wheat', tag:'Cereals', description:'Indian wheat for bulk trade enquiries, with specifications and packing based on buyer requirements.', image:'/assets/products/cer-wheat.svg' },
  { id:'cer-maize', type:'product', parentId:'cat-cereals', name:'Maize', tag:'Cereals', description:'Indian maize for international sourcing enquiries and bulk requirements.', image:'/assets/products/cer-maize.jpeg' },

  // Spices
  { id:'cat-spices', type:'category', parentId:null, name:'Spices', tag:'Whole & ground spices', description:'A selection of Indian whole and ground spices for global food and trading requirements.', image:'/assets/categories/spices.webp' },
  { id:'sp-cumin', type:'product', parentId:'cat-spices', name:'Cumin Seeds', tag:'Spices', description:'Indian cumin seeds for bulk export enquiries. Grade, cleaning and packing requirements can be discussed.', image:'/assets/products/sp-cumin.svg' },
  { id:'sp-coriander', type:'product', parentId:'cat-spices', name:'Coriander Seeds', tag:'Spices', description:'Indian coriander seeds for international sourcing and bulk trade enquiries.', image:'/assets/products/sp-coriander.svg' },
  { id:'sp-fennel', type:'product', parentId:'cat-spices', name:'Fennel Seeds', tag:'Spices', description:'Indian fennel seeds for export enquiries, subject to grade and availability.', image:'/assets/products/sp-fennel.svg' },
  { id:'sp-fenugreek', type:'product', parentId:'cat-spices', name:'Fenugreek Seeds', tag:'Spices', description:'Indian fenugreek seeds for wholesale and export requirements.', image:'/assets/products/sp-fenugreek.svg' },
  { id:'sp-dill', type:'product', parentId:'cat-spices', name:'Dill Seeds', tag:'Spices', description:'Indian dill seeds for bulk sourcing enquiries.', image:'/assets/products/sp-dill.svg' },
  { id:'sp-pepper', type:'product', parentId:'cat-spices', name:'Black Pepper', tag:'Spices', description:'Indian black pepper for international buyer enquiries and bulk sourcing.', image:'/assets/products/sp-pepper.svg' },
  { id:'sp-turmeric', type:'product', parentId:'cat-spices', name:'Turmeric Powder', tag:'Spices', description:'Indian turmeric powder for export enquiries, with packing and specification options based on buyer requirements.', image:'/assets/products/sp-turmeric.svg' },
  { id:'sp-chilli', type:'product', parentId:'cat-spices', name:'Red Chilli Powder', tag:'Spices', description:'Indian red chilli powder for bulk sourcing and export enquiries.', image:'/assets/products/sp-chilli.svg' },

  // Dehydrated products
  { id:'cat-dehydrated', type:'category', parentId:null, name:'Dehydrated Products', tag:'Value-added ingredients', description:'Dehydrated Indian ingredients for food processors, traders and bulk export enquiries.', image:'/assets/categories/dehydrated.webp' },
  { id:'dep-onion-flakes', type:'product', parentId:'cat-dehydrated', name:'Dehydrated Onion Flakes', tag:'Dehydrated Products', description:'Dehydrated onion flakes for bulk food ingredient and export enquiries.', image:'/assets/products/dep-onion-flakes.svg' },
  { id:'dep-garlic-flakes', type:'product', parentId:'cat-dehydrated', name:'Dehydrated Garlic Flakes', tag:'Dehydrated Products', description:'Dehydrated garlic flakes for food ingredient sourcing and export requirements.', image:'/assets/products/dep-garlic-flakes.svg' },
  { id:'dep-onion-powder', type:'product', parentId:'cat-dehydrated', name:'Dehydrated Onion Powder', tag:'Dehydrated Products', description:'Dehydrated onion powder for bulk ingredient enquiries, subject to grade and specification.', image:'/assets/products/dep-onion-powder.svg' },
  { id:'dep-garlic-powder', type:'product', parentId:'cat-dehydrated', name:'Dehydrated Garlic Powder', tag:'Dehydrated Products', description:'Dehydrated garlic powder for food ingredient and export enquiries.', image:'/assets/products/dep-garlic-powder.svg' },

  // Pulses
  { id:'cat-pulses', type:'category', parentId:null, name:'Pulses', tag:'Indian pulses & dals', description:'Indian pulses for wholesale, food-service and international sourcing requirements.', image:'/assets/categories/pulses.jpg' },
  { id:'pul-chickpeas', type:'product', parentId:'cat-pulses', name:'Chickpeas', tag:'Pulses', description:'Indian chickpeas for bulk export and sourcing enquiries, with grade and packing based on requirements.', image:'/assets/products/pul-chickpeas.svg' },
  { id:'pul-moong', type:'product', parentId:'cat-pulses', name:'Green Moong', tag:'Pulses', description:'Green moong for wholesale and export enquiries, subject to availability and buyer specifications.', image:'/assets/products/pul-moong.jpg' },
  { id:'pul-toor', type:'product', parentId:'cat-pulses', name:'Toor Dal', tag:'Pulses', description:'Indian Toor Dal for bulk sourcing and export enquiries.', image:'/assets/products/pul-toor.svg' },

  // Fruits
  { id:'cat-fruits', type:'category', parentId:null, name:'Fruits', tag:'Fresh Indian produce', description:'Fresh Indian fruit sourcing for international enquiries, subject to season, destination and availability.', image:'/assets/categories/fruits.jpg' },
  { id:'fr-mango', type:'product', parentId:'cat-fruits', name:'Fresh Mango', tag:'Fruits', description:'Indian fresh mango sourcing for seasonal export enquiries. Variety, grade and packing are discussed per destination.', image:'/assets/products/fr-mango.svg' },
  { id:'fr-guava', type:'product', parentId:'cat-fruits', name:'Fresh Guava', tag:'Fruits', description:'Indian fresh guava sourcing for export enquiries, subject to season, grade and buyer requirements.', image:'/assets/products/fr-guava.jpg' },
  { id:'fr-pomegranate', type:'product', parentId:'cat-fruits', name:'Fresh Pomegranate', tag:'Fruits', description:'Indian pomegranate sourcing for export enquiries, subject to season and buyer specifications.', image:'/assets/products/fr-pomegranate.webp' },
  { id:'fr-banana', type:'product', parentId:'cat-fruits', name:'Fresh Banana', tag:'Fruits', description:'Indian banana sourcing for wholesale and export enquiries, subject to season and destination requirements.', image:'/assets/products/fr-banana.jpg' }
];
