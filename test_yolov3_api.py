#!/usr/bin/env python3
"""
Test the YOLOv3 API endpoint for image quality analysis
"""

import requests
import json
import cv2
import numpy as np
import os
import sys

def create_test_image():
    """Create a synthetic test image of grapes"""
    img = np.ones((400, 600, 3), dtype=np.uint8) * 200  # Light background
    
    # Fresh grapes (greenish)
    cv2.circle(img, (100, 100), 30, (50, 200, 50), -1)
    cv2.circle(img, (200, 150), 25, (60, 210, 60), -1)
    cv2.circle(img, (150, 220), 28, (55, 205, 55), -1)
    
    # Damaged grapes (brownish)
    cv2.circle(img, (350, 100), 30, (80, 80, 150), -1)
    cv2.circle(img, (400, 200), 25, (60, 60, 140), -1)
    
    # More fresh
    cv2.circle(img, (500, 150), 32, (50, 200, 50), -1)
    
    output_path = '/tmp/test_grape_api.jpg'
    cv2.imwrite(output_path, img)
    return output_path

def login_fpo(email='fpo@test.com', password='password'):
    """Login as FPO and get auth token"""
    try:
        login_url = 'http://localhost:5000/api/auth/login'
        response = requests.post(login_url, json={
            'email': email,
            'password': password
        })
        
        if response.status_code == 200:
            data = response.json()
            return data.get('token')
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_analyze_image(token, image_path, crop_id):
    """Test the image analysis endpoint"""
    try:
        url = 'http://localhost:5000/api/fpo/analyze-image'
        
        # Prepare multipart form data
        files = {
            'image': open(image_path, 'rb')
        }
        data = {
            'cropId': crop_id
        }
        
        headers = {
            'Authorization': f'Bearer {token}'
        }
        
        print(f"\n📤 Sending request to {url}")
        print(f"   Image: {image_path}")
        print(f"   Crop ID: {crop_id}")
        
        response = requests.post(url, files=files, data=data, headers=headers)
        
        print(f"\n📬 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Analysis successful!\n")
            
            certificate = result.get('certificate', {})
            analysis = result.get('analysis', {})
            
            print("📜 CERTIFICATE SAVED:")
            print(f"   ID: {certificate.get('id')}")
            print(f"   Grade: {certificate.get('grade')}")
            print(f"   Quality Score: {certificate.get('overall_quality_score')}")
            print(f"   Spoilage %: {certificate.get('spoilage_percentage')}%")
            
            print("\n🔍 ANALYSIS DETAILS:")
            print(f"   Detection Method: {analysis.get('detectionMethod')}")
            print(f"   Confidence: {analysis.get('confidence')}")
            print(f"   Detections: {len(analysis.get('detections', []))}")
            
            print("\n📊 QUALITY METRICS:")
            metrics = analysis.get('qualityMetrics', {})
            print(f"   Freshness: {metrics.get('freshnessScore')}")
            print(f"   Color Texture: {metrics.get('colorTextureScore')}")
            
            print("\n✨ Full Response:")
            print(json.dumps(result, indent=2))
            
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Request error: {e}")
        return False

def main():
    print("=" * 70)
    print("YOLOv3 Image Quality Analysis - API Testing")
    print("=" * 70)
    
    # Create test image
    print("\n1️⃣  Creating test image...")
    image_path = create_test_image()
    print(f"✅ Test image created: {image_path}")
    
    # Login
    print("\n2️⃣  Attempting FPO login...")
    print("   ⚠️  Note: This requires proper FPO account setup")
    print("   Trying with default test credentials...")
    
    # Try to login or use bypass
    token = login_fpo()
    
    if not token:
        print("\n⚠️  Login failed - Testing may require authentication setup")
        print("   You can manually test the endpoint later once FPO is registered")
        
        # Try to show the test anyway
        crop_id = '550e8400-e29b-41d4-a716-446655440001'
        print(f"\n📝 To test manually, run:")
        print(f"   1. Register/Login as FPO")
        print(f"   2. Get authentication token")
        print(f"   3. Run:")
        print(f"      curl -X POST http://localhost:5000/api/fpo/analyze-image \\")
        print(f"        -H 'Authorization: Bearer YOUR_TOKEN' \\")
        print(f"        -F 'image=@{image_path}' \\")
        print(f"        -F 'cropId={crop_id}'")
        
        # Cleanup
        if os.path.exists(image_path):
            os.remove(image_path)
        return
    
    # Test the endpoint
    print("\n3️⃣  Testing image analysis endpoint...")
    crop_id = '550e8400-e29b-41d4-a716-446655440001'
    
    success = test_analyze_image(token, image_path, crop_id)
    
    # Cleanup
    if os.path.exists(image_path):
        os.remove(image_path)
        print("\n🧹 Cleaned up test image")
    
    print("\n" + "=" * 70)
    if success:
        print("✅ Test PASSED - YOLOv3 endpoint is working!")
    else:
        print("❌ Test FAILED - Check authentication and endpoint")
    print("=" * 70)

if __name__ == '__main__':
    main()
