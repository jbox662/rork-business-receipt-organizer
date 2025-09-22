import { supabase } from '@/constants/supabase';

export interface StorageSetupResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Check if the receipts storage bucket exists and is properly configured
 */
export async function checkStorageSetup(): Promise<StorageSetupResult> {
  try {
    console.log('=== STORAGE SETUP CHECK ===');
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        message: 'User not authenticated. Please sign in first.',
        details: { authError }
      };
    }
    
    console.log('✅ User authenticated:', user.id);
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      return {
        success: false,
        message: 'Failed to list storage buckets. Check your Supabase connection.',
        details: { bucketsError }
      };
    }
    
    console.log('Available buckets:', buckets?.map(b => ({ name: b.name, public: b.public })) || []);
    
    // Check if receipt-images bucket exists
    const receiptBucket = buckets?.find(b => b.name === 'receipt-images');
    if (!receiptBucket) {
      return {
        success: false,
        message: 'Storage bucket "receipt-images" not found. Please create it in your Supabase dashboard.',
        details: {
          availableBuckets: buckets?.map(b => b.name) || [],
          instructions: [
            '1. Go to your Supabase dashboard',
            '2. Navigate to Storage section',
            '3. Click "Create a new bucket"',
            '4. Name it "receipt-images"',
            '5. Enable "Public bucket" option',
            '6. Set up the storage policies as described in SUPABASE_SETUP.md'
          ]
        }
      };
    }
    
    console.log('✅ receipt-images bucket found, public:', receiptBucket.public);
    
    if (!receiptBucket.public) {
      return {
        success: false,
        message: 'Storage bucket "receipt-images" exists but is not public. Images won\'t be accessible.',
        details: {
          bucketInfo: receiptBucket,
          instructions: [
            '1. Go to your Supabase dashboard',
            '2. Navigate to Storage > receipt-images',
            '3. Go to Settings tab',
            '4. Enable "Public bucket" option'
          ]
        }
      };
    }
    
    // Test upload permissions by trying to list files in user's folder
    try {
      const testPath = `${user.id}/`;
      const { data: files, error: listError } = await supabase.storage
        .from('receipt-images')
        .list(testPath);
        
      if (listError) {
        console.warn('⚠️ Cannot list files in user folder:', listError);
        // This might be normal if no files exist yet
      } else {
        console.log('✅ Can list files in user folder, found:', files?.length || 0, 'files');
      }
    } catch (listTestError) {
      console.warn('⚠️ List test failed:', listTestError);
    }
    
    // Test if we can generate a public URL (this doesn't require upload permissions)
    const testUrl = supabase.storage
      .from('receipt-images')
      .getPublicUrl('test-path');
      
    console.log('✅ Can generate public URLs:', !!testUrl.data.publicUrl);
    
    return {
      success: true,
      message: 'Storage setup looks good! The receipt-images bucket exists and is public.',
      details: {
        bucketInfo: receiptBucket,
        userFolder: `${user.id}/`,
        samplePublicUrl: testUrl.data.publicUrl
      }
    };
    
  } catch (error) {
    console.error('Storage setup check failed:', error);
    return {
      success: false,
      message: 'Storage setup check failed with an unexpected error.',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * Attempt to create the receipt-images bucket (requires service role key)
 * This function is mainly for documentation - users need to create the bucket manually
 */
export async function createReceiptImagesBucket(): Promise<StorageSetupResult> {
  try {
    console.log('Attempting to create receipt-images bucket...');
    
    const { data, error } = await supabase.storage.createBucket('receipt-images', {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });
    
    if (error) {
      return {
        success: false,
        message: 'Failed to create bucket. This usually requires admin privileges.',
        details: {
          error: error.message,
          instructions: [
            'You need to create the bucket manually in your Supabase dashboard:',
            '1. Go to Storage section',
            '2. Click "Create a new bucket"',
            '3. Name: "receipt-images"',
            '4. Enable "Public bucket"',
            '5. Set file size limit to 50MB',
            '6. Set allowed MIME types to image/*'
          ]
        }
      };
    }
    
    return {
      success: true,
      message: 'Successfully created receipt-images bucket!',
      details: { bucketData: data }
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'Bucket creation failed with an unexpected error.',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * Test image upload and download to verify everything works
 */
/**
 * Debug storage configuration and URL construction
 */
export async function debugStorageConfiguration(): Promise<StorageSetupResult> {
  try {
    console.log('=== DEBUGGING STORAGE CONFIGURATION ===');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        message: 'User not authenticated for debug test.',
        details: { authError }
      };
    }
    
    console.log('User ID:', user.id);
    
    // Test URL generation
    const testPath = `${user.id}/debug_test.png`;
    const { data: urlData } = supabase.storage
      .from('receipt-images')
      .getPublicUrl(testPath);
      
    console.log('Generated public URL:', urlData.publicUrl);
    
    // Parse the URL to understand its structure
    const url = new URL(urlData.publicUrl);
    console.log('URL breakdown:');
    console.log('- Protocol:', url.protocol);
    console.log('- Host:', url.host);
    console.log('- Pathname:', url.pathname);
    console.log('- Search:', url.search);
    
    // Check if the URL structure looks correct
    const expectedPattern = /\/storage\/v1\/object\/public\/receipt-images\//;
    const isCorrectStructure = expectedPattern.test(url.pathname);
    console.log('URL structure is correct:', isCorrectStructure);
    
    if (!isCorrectStructure) {
      return {
        success: false,
        message: 'Storage URL structure is incorrect. This suggests a bucket configuration issue.',
        details: {
          generatedUrl: urlData.publicUrl,
          expectedPattern: expectedPattern.toString(),
          actualPathname: url.pathname,
          instructions: [
            'Check if the "receipt-images" bucket exists in your Supabase dashboard',
            'Ensure the bucket is set to "Public"',
            'Verify your Supabase URL and keys are correct'
          ]
        }
      };
    }
    
    return {
      success: true,
      message: 'Storage configuration debugging completed. URL structure looks correct.',
      details: {
        userId: user.id,
        testPath,
        generatedUrl: urlData.publicUrl,
        urlStructure: 'correct'
      }
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'Storage configuration debugging failed.',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

export async function testImageUploadDownload(): Promise<StorageSetupResult> {
  try {
    console.log('=== TESTING IMAGE UPLOAD/DOWNLOAD ===');
    
    // First run debug to understand URL structure
    const debugResult = await debugStorageConfiguration();
    console.log('Debug result:', debugResult);
    
    if (!debugResult.success) {
      return debugResult;
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        message: 'User not authenticated for upload test.',
        details: { authError }
      };
    }
    
    // Create a small test image (1x1 pixel PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
    const testImageData = Uint8Array.from(atob(testImageBase64), c => c.charCodeAt(0));
    
    const testFileName = `test_${Date.now()}.png`;
    const testPath = `${user.id}/${testFileName}`;
    
    console.log('Uploading test image to:', testPath);
    console.log('Full upload URL will be: /storage/v1/object/receipt-images/' + testPath);
    
    // Upload test image
    console.log('Attempting upload with Supabase client...');
    console.log('Bucket: receipt-images');
    console.log('Path:', testPath);
    console.log('Data size:', testImageData.byteLength, 'bytes');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipt-images')
      .upload(testPath, testImageData, {
        contentType: 'image/png',
        upsert: true
      });
      
    console.log('Upload response data:', uploadData);
    console.log('Upload response error:', uploadError);
      
    if (uploadError) {
      return {
        success: false,
        message: 'Test image upload failed.',
        details: {
          uploadError: uploadError.message,
          possibleCauses: [
            'Storage policies not set up correctly',
            'Bucket permissions issue',
            'User not authenticated properly'
          ]
        }
      };
    }
    
    console.log('✅ Test image uploaded successfully');
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('receipt-images')
      .getPublicUrl(testPath);
      
    const publicUrl = urlData.publicUrl;
    console.log('✅ Public URL generated:', publicUrl);
    
    // Test if URL is accessible
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' });
      if (!response.ok) {
        return {
          success: false,
          message: 'Test image uploaded but not accessible via public URL.',
          details: {
            publicUrl,
            responseStatus: response.status,
            possibleCauses: [
              'Bucket is not public',
              'Storage policies block public access',
              'Network connectivity issue'
            ]
          }
        };
      }
    } catch (fetchError) {
      return {
        success: false,
        message: 'Test image uploaded but URL accessibility test failed.',
        details: {
          publicUrl,
          fetchError: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        }
      };
    }
    
    console.log('✅ Test image is accessible via public URL');
    
    // Clean up - delete test image
    const { error: deleteError } = await supabase.storage
      .from('receipt-images')
      .remove([testPath]);
      
    if (deleteError) {
      console.warn('⚠️ Failed to clean up test image:', deleteError.message);
    } else {
      console.log('✅ Test image cleaned up successfully');
    }
    
    return {
      success: true,
      message: 'Image upload/download test completed successfully! Your storage is working correctly.',
      details: {
        uploadPath: testPath,
        publicUrl,
        testPassed: true
      }
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'Image upload/download test failed with an unexpected error.',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}