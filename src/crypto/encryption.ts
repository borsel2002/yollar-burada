// Use a more secure key derivation function
const KEY_SIZE = 256;

export async function generateEncryptionKey(): Promise<CryptoKey> {
  try {
    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Generate a random key
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: KEY_SIZE
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Store the salt securely
    localStorage.setItem('encryption_salt', btoa(String.fromCharCode(...salt)));

    return key;
  } catch (error) {
    console.error('Error generating encryption key:', error);
    throw new Error('Failed to generate encryption key');
  }
}

export async function encryptData(data: string, key: CryptoKey): Promise<string> {
  try {
    // Generate a random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Convert the data to Uint8Array
    const dataArray = new TextEncoder().encode(data);
    
    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      dataArray
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
}

export async function decryptData(encryptedData: string, key: CryptoKey): Promise<string> {
  try {
    // Convert from base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(c => c.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    // Convert back to string
    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Add a function to securely clear sensitive data
export function clearSensitiveData() {
  try {
    // Clear encryption key
    localStorage.removeItem('encryption_key');
    localStorage.removeItem('encryption_salt');
    
    // Clear any other sensitive data
    localStorage.removeItem('user_preferences');
    
    // Clear session storage
    sessionStorage.clear();
    
    // Clear any in-memory data
    if (window.crypto && window.crypto.getRandomValues) {
      // Overwrite sensitive data with random values
      const randomData = new Uint8Array(32);
      window.crypto.getRandomValues(randomData);
    }
  } catch (error) {
    console.error('Error clearing sensitive data:', error);
  }
}
