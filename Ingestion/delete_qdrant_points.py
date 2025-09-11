from qdrant_client import QdrantClient
import sys

def delete_all_points(collection_name: str):
    client = QdrantClient(url="http://localhost:6333")
    # Passing None deletes all points in the collection
    for i in range(300):
        result = client.delete(collection_name=collection_name, points_selector= [i])

    print(f"Delete request sent for all points in collection '{collection_name}'. Result: {result}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        collection = sys.argv[1]
    else:
        collection = "New_Collection"
    delete_all_points(collection)
    # To delete from the CLIP collection as well, uncomment the next line:
    delete_all_points("New_Collection_CLIP") 