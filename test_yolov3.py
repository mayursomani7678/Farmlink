#!/usr/bin/env python3
"""
Test YOLOv3 Image Detection with a generated test image
"""

import sys
import os
import json
import cv2
import numpy as np

# Add backend path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend/src/python_scripts'))

from yolov3_detector import analyze_grape_image

def create_test_image(output_path='test_image.jpg'):
    """Create a synthetic test image of grapes"""
    # Create an image with grape-like patterns
    img = np.ones((400, 600, 3), dtype=np.uint8) * 200  # Light background
    
    # Draw some circular shapes representing grapes
    # Fresh grapes (greenish)
    cv2.circle(img, (100, 100), 30, (50, 200, 50), -1)  # Green
    cv2.circle(img, (200, 150), 25, (60, 210, 60), -1)
    cv2.circle(img, (150, 220), 28, (55, 205, 55), -1)
    
    # Damaged grapes (brownish/dark)
    cv2.circle(img, (350, 100), 30, (80, 80, 150), -1)  # Brown
    cv2.circle(img, (400, 200), 25, (60, 60, 140), -1)
    
    # More fresh grapes
    cv2.circle(img, (500, 150), 32, (50, 200, 50), -1)
    
    cv2.imwrite(output_path, img)
    return output_path

def main():
    print("=" * 60)
    print("YOLOv3 Grape Quality Detection Test")
    print("=" * 60)
    
    # Create test image
    print("\n1️⃣  Creating test image...")
    test_image = create_test_image('test_grape_image.jpg')
    print(f"✅ Test image created: {test_image}")
    print(f"   Image size: {os.path.getsize(test_image)} bytes")
    
    # Analyze image
    print("\n2️⃣  Analyzing image with YOLOv3...")
    try:
        result = analyze_grape_image(test_image)
        
        if 'error' in result:
            print(f"❌ Error: {result['error']}")
            return
        
        print("✅ Analysis completed successfully!")
        
        # Display results
        print("\n📊 DETECTION RESULTS:")
        print(f"   Detection Method: {result.get('detection_method', 'unknown')}")
        print(f"   Overall Confidence: {result['overall_confidence']}")
        print(f"   Grade: {result['grade']}")
        
        print("\n📈 QUALITY METRICS:")
        metrics = result.get('quality_metrics', {})
        print(f"   Overall Quality Score: {metrics.get('overall_quality_score', 0)}/1.0")
        print(f"   Freshness Score: {metrics.get('freshness_score', 0)}/1.0")
        print(f"   Spoilage %: {metrics.get('spoilage_percentage', 0)}%")
        print(f"   Color Texture Score: {metrics.get('color_texture_score', 0)}/1.0")
        
        print("\n🔍 DETECTIONS:")
        stats = result.get('stats', {})
        print(f"   Total Detections: {stats.get('total_detections', 0)}")
        print(f"   Fresh Count: {stats.get('fresh_count', 0)}")
        print(f"   Damaged Count: {stats.get('damaged_count', 0)}")
        
        print("\n📋 RAW DETECTIONS:")
        for i, detection in enumerate(result.get('detections', [])[:5]):
            print(f"   [{i+1}] {detection['class'].upper()} - Confidence: {detection['confidence']}")
        
        if len(result.get('detections', [])) > 5:
            print(f"   ... and {len(result['detections']) - 5} more detections")
        
        print("\n✨ Full Result JSON:")
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Cleanup
        if os.path.exists(test_image):
            os.remove(test_image)
            print(f"\n🧹 Cleaned up test image")
    
    print("\n" + "=" * 60)
    print("Test Complete!")
    print("=" * 60)

if __name__ == '__main__':
    main()
