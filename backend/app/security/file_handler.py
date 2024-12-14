"""Secure file handling operations."""
import os
import hashlib
import magic
import shutil
from typing import Optional, Tuple
from werkzeug.utils import secure_filename
from flask import current_app
import boto3
from botocore.exceptions import ClientError
from cryptography.fernet import Fernet
import tempfile
from ..models import AuditLog

class SecureFileHandler:
    """Handle file operations securely."""
    
    ALLOWED_MIME_TYPES = {
        'application/pdf': '.pdf',
        'application/vnd.ms-excel': '.xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'text/csv': '.csv',
        'text/xml': '.xml',
        'application/xml': '.xml'
    }
    
    def __init__(self):
        """Initialize secure file handler."""
        self.s3_client = boto3.client('s3')
        self.fernet = Fernet(current_app.config['FILE_ENCRYPTION_KEY'].encode())
    
    def secure_save_file(self, file, user_id: int) -> Tuple[bool, str]:
        """
        Save file securely with encryption.
        
        Args:
            file: File object to save
            user_id: ID of user uploading the file
            
        Returns:
            Tuple of (success, message)
        """
        try:
            # Create temp file for processing
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                file.save(temp_file.name)
                
                # Verify file type
                mime_type = magic.from_file(temp_file.name, mime=True)
                if mime_type not in self.ALLOWED_MIME_TYPES:
                    os.unlink(temp_file.name)
                    return False, "Invalid file type"
                
                # Verify file extension matches content
                filename = secure_filename(file.filename)
                if not filename.endswith(self.ALLOWED_MIME_TYPES[mime_type]):
                    os.unlink(temp_file.name)
                    return False, "File extension doesn't match content"
                
                # Calculate file hash
                file_hash = self._calculate_file_hash(temp_file.name)
                
                # Encrypt file
                encrypted_data = self._encrypt_file(temp_file.name)
                
                # Generate secure filename
                secure_name = f"{file_hash}{self.ALLOWED_MIME_TYPES[mime_type]}"
                
                # Save to S3
                self._upload_to_s3(encrypted_data, secure_name)
                
                # Log file upload
                AuditLog.log(
                    user_id=user_id,
                    action='file_upload',
                    resource='file',
                    resource_id=None,
                    ip_address=None,
                    user_agent=None,
                    status='success',
                    details=f"File uploaded: {filename} (hash: {file_hash})"
                )
                
                os.unlink(temp_file.name)
                return True, secure_name
                
        except Exception as e:
            # Log error
            AuditLog.log(
                user_id=user_id,
                action='file_upload',
                resource='file',
                resource_id=None,
                ip_address=None,
                user_agent=None,
                status='error',
                details=f"Error uploading file: {str(e)}"
            )
            return False, str(e)
    
    def secure_read_file(self, filename: str, user_id: int) -> Tuple[Optional[bytes], str]:
        """
        Read file securely with decryption.
        
        Args:
            filename: Name of file to read
            user_id: ID of user requesting the file
            
        Returns:
            Tuple of (file_content, message)
        """
        try:
            # Download from S3
            encrypted_data = self._download_from_s3(filename)
            if not encrypted_data:
                return None, "File not found"
            
            # Create temp file for processing
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                # Decrypt file
                decrypted_data = self._decrypt_data(encrypted_data)
                temp_file.write(decrypted_data)
                temp_file.flush()
                
                # Verify file type
                mime_type = magic.from_file(temp_file.name, mime=True)
                if mime_type not in self.ALLOWED_MIME_TYPES:
                    os.unlink(temp_file.name)
                    return None, "Invalid file type"
                
                # Log file access
                AuditLog.log(
                    user_id=user_id,
                    action='file_read',
                    resource='file',
                    resource_id=None,
                    ip_address=None,
                    user_agent=None,
                    status='success',
                    details=f"File accessed: {filename}"
                )
                
                with open(temp_file.name, 'rb') as f:
                    content = f.read()
                
                os.unlink(temp_file.name)
                return content, "Success"
                
        except Exception as e:
            # Log error
            AuditLog.log(
                user_id=user_id,
                action='file_read',
                resource='file',
                resource_id=None,
                ip_address=None,
                user_agent=None,
                status='error',
                details=f"Error reading file: {str(e)}"
            )
            return None, str(e)
    
    def secure_delete_file(self, filename: str, user_id: int) -> Tuple[bool, str]:
        """
        Delete file securely.
        
        Args:
            filename: Name of file to delete
            user_id: ID of user requesting deletion
            
        Returns:
            Tuple of (success, message)
        """
        try:
            # Delete from S3
            self.s3_client.delete_object(
                Bucket=current_app.config['S3_BUCKET'],
                Key=filename
            )
            
            # Log file deletion
            AuditLog.log(
                user_id=user_id,
                action='file_delete',
                resource='file',
                resource_id=None,
                ip_address=None,
                user_agent=None,
                status='success',
                details=f"File deleted: {filename}"
            )
            
            return True, "File deleted successfully"
            
        except Exception as e:
            # Log error
            AuditLog.log(
                user_id=user_id,
                action='file_delete',
                resource='file',
                resource_id=None,
                ip_address=None,
                user_agent=None,
                status='error',
                details=f"Error deleting file: {str(e)}"
            )
            return False, str(e)
    
    def _calculate_file_hash(self, filepath: str) -> str:
        """Calculate SHA-256 hash of file."""
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def _encrypt_file(self, filepath: str) -> bytes:
        """Encrypt file using Fernet."""
        with open(filepath, 'rb') as f:
            data = f.read()
        return self.fernet.encrypt(data)
    
    def _decrypt_data(self, data: bytes) -> bytes:
        """Decrypt data using Fernet."""
        return self.fernet.decrypt(data)
    
    def _upload_to_s3(self, data: bytes, filename: str) -> None:
        """Upload encrypted data to S3."""
        self.s3_client.put_object(
            Bucket=current_app.config['S3_BUCKET'],
            Key=filename,
            Body=data,
            ServerSideEncryption='AES256'
        )
    
    def _download_from_s3(self, filename: str) -> Optional[bytes]:
        """Download encrypted data from S3."""
        try:
            response = self.s3_client.get_object(
                Bucket=current_app.config['S3_BUCKET'],
                Key=filename
            )
            return response['Body'].read()
        except ClientError:
            return None
