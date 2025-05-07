
import { ScannerResult, ProspectCard, CardStatus } from "@/types/card";

// This is a placeholder implementation
// In a real application, you would integrate with a real OCR service
export const scanCard = async (imageFile: File): Promise<ScannerResult> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // For demo purposes, we'll randomly determine if the scan was successful
  const random = Math.random();
  
  if (random > 0.8) {
    // Simulate an error condition
    return {
      success: false,
      errorMessage: "Could not process the image. Please try again with a clearer image."
    };
  }
  
  if (random > 0.6) {
    // Simulate missing fields
    return {
      success: true,
      data: {
        name: "John Doe",
        email: "john.doe@example.com",
        // Missing phone and other fields
        highSchool: "Springfield High",
        graduationYear: "2024",
        major: "Computer Science",
        interests: ["Technology", "Music"]
      },
      missingFields: ["phone", "address", "city", "state", "zipCode"]
    };
  }
  
  // Simulate successful scan with complete data
  return {
    success: true,
    data: {
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "555-123-4567",
      address: "123 Main St",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      highSchool: "Springfield High",
      graduationYear: "2024",
      major: "Biology",
      interests: ["Science", "Arts", "Sports"],
      notes: "Interested in pre-med program"
    }
  };
};

export const generateMockCards = (count: number = 10): ProspectCard[] => {
  const statuses: Array<CardStatus> = ['complete', 'error', 'missing_info', 'processing'];
  const names = ["John Doe", "Jane Smith", "Alice Johnson", "Bob Brown", "Charlie Davis"];
  const majors = ["Computer Science", "Biology", "Business", "Engineering", "Psychology"];
  const highSchools = ["Springfield High", "Washington High", "Lincoln Academy", "Jefferson High"];
  
  return Array.from({ length: count }).map((_, index) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)] as CardStatus;
    const created = new Date();
    created.setDate(created.getDate() - Math.floor(Math.random() * 30));
    
    const updated = new Date(created);
    updated.setHours(updated.getHours() + Math.floor(Math.random() * 5));
    
    const card: ProspectCard = {
      id: `card-${index + 1}`,
      imageUrl: `https://picsum.photos/id/${(index + 10) % 100}/300/200`,
      status,
      createdAt: created.toISOString(), // Convert Date to string
      updatedAt: updated.toISOString()  // Convert Date to string
    };
    
    if (status === 'complete' || status === 'missing_info') {
      const name = names[Math.floor(Math.random() * names.length)];
      const email = `${name.toLowerCase().replace(' ', '.')}@example.com`;
      const highSchool = highSchools[Math.floor(Math.random() * highSchools.length)];
      const major = majors[Math.floor(Math.random() * majors.length)];
      const graduationYear = String(2023 + Math.floor(Math.random() * 3));
      
      card.data = {
        name,
        email,
        highSchool,
        major,
        graduationYear,
        interests: []
      };
      
      if (status === 'missing_info') {
        const possibleMissingFields = ['phone', 'address', 'city', 'state', 'zipCode', 'notes'];
        const numberOfMissingFields = 1 + Math.floor(Math.random() * 3);
        card.missingFields = possibleMissingFields
          .sort(() => 0.5 - Math.random())
          .slice(0, numberOfMissingFields);
      }
    } else if (status === 'error') {
      card.errorMessage = "Failed to process the image. Please try again with a clearer image.";
    }
    
    return card;
  });
};
