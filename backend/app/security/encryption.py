"""Encryption and key management utilities."""
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
import base64
import os
from typing import Tuple, Optional
import boto3
from botocore.exceptions import ClientError
from flask import current_app
import json

class KeyManagement:
    """Secure key management using AWS KMS."""
    
    def __init__(self):
        """Initialize KMS client."""
        self.kms_client = boto3.client('kms')
        self.key_id = current_app.config['KMS_KEY_ID']
    
    def generate_data_key(self) -> Tuple[bytes, bytes]:
        """
        Generate a new data key using KMS.
        
        Returns:
            Tuple of (plaintext_key, encrypted_key)
        """
        try:
            response = self.kms_client.generate_data_key(
                KeyId=self.key_id,
                KeySpec='AES_256'
            )
            return response['Plaintext'], response['CiphertextBlob']
        except ClientError as e:
            current_app.logger.error(f"Error generating data key: {str(e)}")
            raise
    
    def decrypt_data_key(self, encrypted_key: bytes) -> bytes:
        """
        Decrypt a data key using KMS.
        
        Args:
            encrypted_key: The encrypted data key
            
        Returns:
            Decrypted data key
        """
        try:
            response = self.kms_client.decrypt(
                KeyId=self.key_id,
                CiphertextBlob=encrypted_key
            )
            return response['Plaintext']
        except ClientError as e:
            current_app.logger.error(f"Error decrypting data key: {str(e)}")
            raise

class DataEncryption:
    """Handle data encryption and decryption."""
    
    def __init__(self):
        """Initialize encryption utilities."""
        self.key_management = KeyManagement()
    
    def encrypt_data(self, data: str) -> Tuple[str, bytes]:
        """
        Encrypt data using a new data key.
        
        Args:
            data: Data to encrypt
            
        Returns:
            Tuple of (encrypted_data, encrypted_key)
        """
        # Generate new data key
        data_key, encrypted_key = self.key_management.generate_data_key()
        
        # Create cipher
        iv = os.urandom(16)
        cipher = Cipher(
            algorithms.AES(data_key),
            modes.CBC(iv),
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        
        # Pad data
        padder = padding.PKCS7(128).padder()
        padded_data = padder.update(data.encode()) + padder.finalize()
        
        # Encrypt data
        encrypted_data = encryptor.update(padded_data) + encryptor.finalize()
        
        # Combine IV and encrypted data
        combined = base64.b64encode(iv + encrypted_data).decode('utf-8')
        
        return combined, encrypted_key
    
    def decrypt_data(self, encrypted_data: str, encrypted_key: bytes) -> str:
        """
        Decrypt data using the encrypted data key.
        
        Args:
            encrypted_data: Base64 encoded encrypted data
            encrypted_key: Encrypted data key
            
        Returns:
            Decrypted data
        """
        # Decrypt the data key
        data_key = self.key_management.decrypt_data_key(encrypted_key)
        
        # Decode and split IV and ciphertext
        combined = base64.b64decode(encrypted_data.encode('utf-8'))
        iv = combined[:16]
        ciphertext = combined[16:]
        
        # Create cipher
        cipher = Cipher(
            algorithms.AES(data_key),
            modes.CBC(iv),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        
        # Decrypt data
        padded_data = decryptor.update(ciphertext) + decryptor.finalize()
        
        # Unpad data
        unpadder = padding.PKCS7(128).unpadder()
        data = unpadder.update(padded_data) + unpadder.finalize()
        
        return data.decode('utf-8')

class FieldEncryption:
    """Handle database field encryption."""
    
    def __init__(self):
        """Initialize field encryption."""
        self.data_encryption = DataEncryption()
    
    def encrypt_field(self, value: str) -> dict:
        """
        Encrypt a database field value.
        
        Args:
            value: Value to encrypt
            
        Returns:
            Dictionary with encrypted data and key
        """
        encrypted_data, encrypted_key = self.data_encryption.encrypt_data(value)
        return {
            'data': encrypted_data,
            'key': base64.b64encode(encrypted_key).decode('utf-8')
        }
    
    def decrypt_field(self, encrypted_value: dict) -> Optional[str]:
        """
        Decrypt a database field value.
        
        Args:
            encrypted_value: Dictionary with encrypted data and key
            
        Returns:
            Decrypted value or None if invalid
        """
        try:
            encrypted_key = base64.b64decode(encrypted_value['key'].encode('utf-8'))
            return self.data_encryption.decrypt_data(
                encrypted_value['data'],
                encrypted_key
            )
        except (KeyError, ValueError, TypeError):
            return None

class SecureTokenGenerator:
    """Generate secure tokens for various purposes."""
    
    @staticmethod
    def generate_token(length: int = 32) -> str:
        """Generate a secure random token."""
        return base64.urlsafe_b64encode(os.urandom(length)).decode('utf-8')
    
    @staticmethod
    def generate_salt(length: int = 16) -> bytes:
        """Generate a random salt."""
        return os.urandom(length)
    
    @staticmethod
    def derive_key(password: str, salt: bytes, length: int = 32) -> bytes:
        """Derive a key from a password using PBKDF2."""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=length,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        return base64.urlsafe_b64encode(kdf.derive(password.encode()))
