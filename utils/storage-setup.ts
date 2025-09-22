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
    
    // Check if receipts bucket exists
    const receiptBucket = buckets?.find(b => b.name === 'receipts');
    if (!receiptBucket) {
      return {
        success: false,
        message: 'Storage bucket "receipts" not found. Please create it in your Supabase dashboard.',
        details: {
          availableBuckets: buckets?.map(b => b.name) || [],
          instructions: [
            '1. Go to your Supabase dashboard',
            '2. Navigate to Storage section',
            '3. Click "Create a new bucket"',
            '4. Name it "receipts"',
            '5. Enable "Public bucket" option',
            '6. Set up the storage policies as described in SUPABASE_SETUP.md'
          ]
        }
      };
    }
    
    console.log('✅ receipts bucket found, public:', receiptBucket.public);
    
    if (!receiptBucket.public) {
      return {
        success: false,
        message: 'Storage bucket "receipts" exists but is not public. Images won\'t be accessible.',
        details: {
          bucketInfo: receiptBucket,
          instructions: [
            '1. Go to your Supabase dashboard',
            '2. Navigate to Storage > receipts',
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
        .from('receipts')
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
      .from('receipts')
      .getPublicUrl('test-path');
      
    console.log('✅ Can generate public URLs:', !!testUrl.data.publicUrl);
    
    return {
      success: true,
      message: 'Storage setup looks good! The receipts bucket exists and is public.',
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
 * Attempt to create the receipts bucket (requires service role key)
 * This function is mainly for documentation - users need to create the bucket manually
 */
export async function createReceiptImagesBucket(): Promise<StorageSetupResult> {
  try {
    console.log('Attempting to create receipts bucket...');
    
    const { data, error } = await supabase.storage.createBucket('receipts', {
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
            '3. Name: "receipts"',
            '4. Enable "Public bucket"',
            '5. Set file size limit to 50MB',
            '6. Set allowed MIME types to image/*'
          ]
        }
      };
    }
    
    return {
      success: true,
      message: 'Successfully created receipts bucket!',
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
export async function testImageUploadDownload(): Promise<StorageSetupResult> {
  try {
    console.log('=== TESTING IMAGE UPLOAD/DOWNLOAD ===');
    
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
    
    // Upload test image
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(testPath, testImageData, {
        contentType: 'image/png',
        upsert: true
      });
      
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
      .from('receipts')
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
      .from('receipts')
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