import { ReceiptScanResult } from '@/types/receipt';

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
      suggestedCategory: result.suggestedCategory || 'Other',
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