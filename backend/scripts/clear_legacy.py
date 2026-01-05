#!/usr/bin/env python3
"""
Legacy Data Cleanup Script

This script clears all documents from the Qdrant vector store collection.
Run this ONCE before deploying the user-scoped version to remove legacy data
that lacks user_id metadata.

WARNING: This will delete ALL documents in the collection!

Usage:
    cd backend
    python scripts/clear_legacy.py
"""

import sys
import os

# Add parent directory to path to import from tools
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.vector_store import clear_collection, client, COLLECTION_NAME


def main():
    print("=" * 60)
    print("    LEGACY DATA CLEANUP SCRIPT")
    print("=" * 60)
    print()
    print(f"This will DELETE ALL documents from collection: '{COLLECTION_NAME}'")
    print("This action cannot be undone!")
    print()
    
    # Show current collection stats
    try:
        collection_info = client.get_collection(COLLECTION_NAME)
        print(f"Current collection stats:")
        print(f"  - Points count: {collection_info.points_count}")
        print(f"  - Vectors count: {collection_info.vectors_count}")
        print()
    except Exception as e:
        print(f"Could not get collection info: {e}")
        print()
    
    # Confirmation prompt
    confirm = input("Type 'DELETE' to confirm deletion: ").strip()
    
    if confirm != "DELETE":
        print("\nAborted. No changes made.")
        return
    
    print("\n🗑️  Clearing collection...")
    
    success = clear_collection()
    
    if success:
        print("\n✅ Successfully cleared all legacy data!")
        print("The collection has been recreated empty and is ready for user-scoped data.")
    else:
        print("\n❌ Failed to clear collection. Check the error messages above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
