import { ReceiptScanResult } from '@/types/receipt';
import { DEFAULT_CATEGORIES } from '@/constants/categories';

interface ImageQualityResult {
  isGoodQuality: boolean;
  issues: string[];
  score: number;
}

interface ImageEnhancementResult {
  success: boolean;
  enhancedImageBase64?: string;
  error?: string;
}

// Auto-categorization rules based on merchant names
const MERCHANT_CATEGORY_RULES = {
  'Office Supplies': ['staples', 'office depot', 'best buy', 'amazon', 'costco', 'walmart', 'target'],
  'Travel': ['uber', 'lyft', 'hotel', 'airbnb', 'airline', 'expedia', 'booking', 'hertz', 'enterprise', 'avis'],
  'Meals & Entertainment': ['restaurant', 'cafe', 'starbucks', 'mcdonalds', 'subway', 'pizza', 'bar', 'pub', 'diner', 'food'],
  'Transportation': ['gas', 'shell', 'exxon', 'chevron', 'bp', 'mobil', 'parking', 'metro', 'taxi'],
  'Equipment': ['apple', 'microsoft', 'dell', 'hp', 'lenovo', 'home depot', 'lowes', 'tools'],
  'Marketing': ['google', 'facebook', 'instagram', 'linkedin', 'twitter', 'adobe', 'canva'],
  'Utilities': ['electric', 'water', 'internet', 'phone', 'verizon', 'att', 'comcast', 'spectrum']
};

function suggestCategory(merchant: string): string {
  const merchantLower = merchant.toLowerCase();
  
  for (const [category, keywords] of Object.entries(MERCHANT_CATEGORY_RULES)) {
    if (keywords.some(keyword => merchantLower.includes(keyword))) {
      return category;
    }
  }
  
  return 'Other';
}

const SYSTEM_PROMPT = `You are a receipt scanner AI. Extract information from receipt images and return structured data.
Analyze the receipt and extract:
- Merchant/Store name
- Date of purchase
- Total amount
- Tax amount
- Subtotal
- Individual items with name, quantity, price, and total
- Payment method if visible
- Suggest the most appropriate category from: Office Supplies, Travel, Meals & Entertainment, Transportation, Equipment, Marketing, Utilities, Other

Return the data in this exact JSON format:
{
  "merchant": "Store Name",
  "date": "YYYY-MM-DD",
  "total": 0.00,
  "tax": 0.00,
  "subtotal": 0.00,
  "items": [
    {"name": "Item name", "quantity": 1, "price": 0.00, "total": 0.00}
  ],
  "paymentMethod": "Credit Card",
  "suggestedCategory": "Category Name"
}`;

export async function checkImageQuality(imageBase64: string): Promise<ImageQualityResult> {
  try {
    console.log('Checking image quality...');
    
    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { 
            role: 'system', 
            content: `You are an image quality checker for receipt scanning. Analyze the image and check for:
            - Blur or out of focus areas
            - Poor lighting (too dark or overexposed)
            - Text readability
            - Receipt completeness (all edges visible)
            - Image orientation
            
            Return a JSON response with:
            {
              "isGoodQuality": boolean,
              "issues": ["list of specific issues found"],
              "score": number (0-100, where 100 is perfect quality)
            }`
          },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: 'Please analyze this receipt image quality and identify any issues that might affect scanning accuracy.' },
              { type: 'image', image: imageBase64 }
            ]
          }
        ]
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to check image quality');
    }
    
    const data = await response.json();
    let cleanedResponse = data.completion.trim();
    
    // Clean markdown formatting
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }
    
    const result = JSON.parse(cleanedResponse);
    
    return {
      isGoodQuality: result.isGoodQuality || false,
      issues: result.issues || [],
      score: result.score || 0
    };
  } catch (error) {
    console.error('Error checking image quality:', error);
    // Return a default "good quality" result if check fails
    return {
      isGoodQuality: true,
      issues: [],
      score: 75
    };
  }
}

export async function enhanceReceiptImage(imageBase64: string): Promise<ImageEnhancementResult> {
  try {
    console.log('Enhancing receipt image...');
    
    const response = await fetch('https://toolkit.rork.com/images/edit/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Enhance this receipt image for better text readability. Improve contrast, brightness, and sharpness. Auto-crop to remove unnecessary background. Straighten if rotated. Make the text as clear and readable as possible while maintaining the original receipt content.',
        images: [{ type: 'image', image: imageBase64 }]
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to enhance image');
    }
    
    const data = await response.json();
    
    return {
      success: true,
      enhancedImageBase64: data.image.base64Data
    };
  } catch (error) {
    console.error('Error enhancing image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function scanReceipt(imageBase64: string): Promise<ReceiptScanResult> {
  try {
    console.log('Starting receipt scan with image base64 length:', imageBase64.length);
    
    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: 'Please scan this receipt and extract all information.' },
              { type: 'image', image: imageBase64 }
            ]
          }
        ]
      }),
    });
    
    console.log('AI API response status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error('Failed to scan receipt');
    }

    let data;
    try {
      data = await response.json();
      console.log('Raw AI response:', data.completion);
    } catch (jsonError) {
      console.error('Failed to parse AI response as JSON:', jsonError);
      const responseText = await response.text();
      console.error('Raw response text:', responseText.substring(0, 200));
      throw new Error('AI service returned invalid JSON response');
    }
    
    if (!data.completion) {
      throw new Error('No completion in AI response');
    }
    
    // Clean the response - remove markdown formatting and extract JSON
    let cleanedResponse = data.completion.trim();
    
    // Remove markdown code blocks if present
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Find JSON object in the response
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }
    
    console.log('Cleaned response for parsing:', cleanedResponse);
    
    // Validate that we have something that looks like JSON
    if (!cleanedResponse.startsWith('{') || !cleanedResponse.endsWith('}')) {
      console.error('Response does not appear to be valid JSON:', cleanedResponse);
      throw new Error('AI response is not valid JSON format');
    }
    
    let result;
    try {
      result = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed to parse:', cleanedResponse);
      throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
    }
    
    // Validate and clean the result
    return {
      merchant: result.merchant || 'Unknown Merchant',
      date: result.date || new Date().toISOString().split('T')[0],
      total: parseFloat(result.total) || 0,
      tax: parseFloat(result.tax) || 0,
      subtotal: parseFloat(result.subtotal) || 0,
      items: result.items || [],
      paymentMethod: result.paymentMethod,
      suggestedCategory: result.suggestedCategory || suggestCategory(result.merchant || 'Unknown'),
    };
  } catch (error) {
    console.error('Error scanning receipt:', error);
    
    // Provide a fallback receipt structure so users can still manually enter data
    console.log('Providing fallback receipt structure for manual entry');
    return {
      merchant: 'Unknown Merchant',
      date: new Date().toISOString().split('T')[0],
      total: 0,
      tax: 0,
      subtotal: 0,
      items: [],
      paymentMethod: 'Unknown',
      suggestedCategory: 'Other',
    };
  }
}