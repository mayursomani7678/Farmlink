#!/usr/bin/env python3
"""
Setup YOLOv3 Testing - Register FPO and Test Image Analysis
"""

import requests
import json
import cv2
import numpy as np
import os
import sys
import time

BASE_URL = 'http://localhost:5000'

def create_test_image():
    """Create a synthetic test image"""
    img = np.ones((400, 600, 3), dtype=np.uint8) * 200
    
    # Fresh grapes
    cv2.circle(img, (100, 100), 30, (50, 200, 50), -1)
    cv2.circle(img, (200, 150), 25, (60, 210, 60), -1)
    cv2.circle(img, (150, 220), 28, (55, 205, 55), -1)
    cv2.circle(img, (500, 150), 32, (50, 200, 50), -1)
    
    # Damaged
    cv2.circle(img, (350, 100), 30, (80, 80, 150), -1)
    cv2.circle(img, (400, 200), 25, (60, 60, 140), -1)
    
    output_path = '/tmp/test_yolov3_grapes.jpg'
    # Ensure proper JPEG encoding
    cv2.imwrite(output_path, img, [cv2.IMWRITE_JPEG_QUALITY, 95])
    return output_path

def register_fpo(email, password, full_name):
    """Register FPO user"""
    print(f"\n📝 Registering FPO user: {email}")
    
    try:
        response = requests.post(f'{BASE_URL}/api/auth/register', json={
            'email': email,
            'password': password,
            'fullName': full_name,
            'userType': 'fpo'
        })
        
        if response.status_code == 201:
            print(f"   ✅ Registration successful")
            return True
        elif response.status_code == 400:
            data = response.json()
            if 'already' in data.get('error', '').lower():
                print(f"   ℹ️  User already exists (this is fine)")
                return True
        
        print(f"   ❌ Registration failed: {response.status_code}")
        print(f"   {response.text}")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def login_fpo(email, password):
    """Login FPO user and get token"""
    print(f"\n🔐 Logging in: {email}")
    
    try:
        response = requests.post(f'{BASE_URL}/api/auth/login', json={
            'email': email,
            'password': password
        })
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            print(f"   ✅ Login successful")
            print(f"   Token: {token[:20]}...")
            return token
        else:
            print(f"   ❌ Login failed: {response.status_code}")
            print(f"   {response.text}")
            return None
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None

def test_image_analysis(token, image_path, crop_id):
    """Test image analysis endpoint"""
    print(f"\n📸 Testing image analysis")
    print(f"   Image: {image_path}")
    print(f"   Crop ID: {crop_id}")
    
    try:
        with open(image_path, 'rb') as f:
            # Explicitly set MIME type
            files = {'image': ('test_image.jpg', f, 'image/jpeg')}
            data = {'cropId': crop_id}
            headers = {'Authorization': f'Bearer {token}'}
            
            response = requests.post(
                f'{BASE_URL}/api/fpo/analyze-image',
                files=files,
                data=data,
                headers=headers
            )
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Analysis successful")
            
            cert = result.get('certificate', {})
            print(f"\n   📜 Certificate:")
            print(f"      Grade: {cert.get('grade')}")
            print(f"      Quality Score: {cert.get('overall_quality_score')}")
            print(f"      Spoilage: {cert.get('spoilage_percentage')}%")
            print(f"      Freshness: {cert.get('freshness_score')}")
            
            analysis = result.get('analysis', {})
            print(f"\n   🔍 Analysis:")
            print(f"      Detection Method: {analysis.get('detectionMethod')}")
            print(f"      Detections Found: {len(analysis.get('detections', []))}")
            print(f"      Confidence: {analysis.get('confidence')}")
            
            return True
        else:
            print(f"   ❌ Analysis failed: {response.status_code}")
            print(f"   {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def verify_backend_running():
    """Check if backend is running"""
    try:
        response = requests.get(f'{BASE_URL}/health', timeout=2)
        return response.status_code == 200
    except:
        return False

def main():
    print("=" * 70)
    print("YOLOv3 Testing Setup & Verification")
    print("=" * 70)
    
    # Check backend
    print("\n🔍 Checking backend server...")
    if not verify_backend_running():
        print("❌ Backend is not running!")
        print("   Start it with: cd backend && npm run dev")
        sys.exit(1)
    print("✅ Backend is running")
    
    # Create test image
    print("\n📷 Creating test image...")
    image_path = create_test_image()
    print(f"✅ Test image created: {image_path}")
    
    # FPO credentials
    email = 'fpo.yolov3@test.com'
    password = 'TestPassword123!'
    full_name = 'YOLOv3 Test FPO'
    crop_id = '550e8400-e29b-41d4-a716-446655440001'
    
    # Register FPO
    if not register_fpo(email, password, full_name):
        print("\n❌ Failed to register FPO user")
        sys.exit(1)
    
    # Wait a moment
    time.sleep(1)
    
    # Login
    token = login_fpo(email, password)
    if not token:
        print("\n❌ Failed to login")
        sys.exit(1)
    
    # Test analysis
    if not test_image_analysis(token, image_path, crop_id):
        print("\n❌ Failed to analyze image")
        sys.exit(1)
    
    # Cleanup
    if os.path.exists(image_path):
        os.remove(image_path)
        print("\n🧹 Cleaned up test image")
    
    print("\n" + "=" * 70)
    print("✅ YOLOv3 System is Working!")
    print("=" * 70)
    print("\n📖 Next steps:")
    print("1. Review YOLOV3_IMPLEMENTATION.md")
    print("2. Test with real grape images")
    print("3. Integrate into FPO Dashboard")
    print("\n" + "=" * 70)

if __name__ == '__main__':
    main()
