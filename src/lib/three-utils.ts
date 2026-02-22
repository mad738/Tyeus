import * as THREE from 'three';

/**
 * Spatial Hash helper for efficient nearest neighbor search.
 * Splits the 3D space into a grid of cells.
 */
class SpatialHash {
    private cells: Map<string, number[]>;
    private cellSize: number;
    private minBounds: THREE.Vector3;

    constructor(points: THREE.BufferAttribute, cellSize: number = 0.05) { // default 5cm cell size, tune as needed
        this.cells = new Map();
        this.cellSize = cellSize;
        this.minBounds = new THREE.Vector3(Infinity, Infinity, Infinity);

        // 1. Find bounds to normalize keys (optional, but good for consistency)
        // Actually for a hash map, we can just use raw coords / cellSize flooring.

        const count = points.count;
        const v = new THREE.Vector3();

        for (let i = 0; i < count; i++) {
            v.fromBufferAttribute(points, i);
            const key = this.getKey(v);

            if (!this.cells.has(key)) {
                this.cells.set(key, []);
            }
            this.cells.get(key)!.push(i);
        }
    }

    private getKey(point: THREE.Vector3): string {
        const x = Math.floor(point.x / this.cellSize);
        const y = Math.floor(point.y / this.cellSize);
        const z = Math.floor(point.z / this.cellSize);
        return `${x},${y},${z}`;
    }

    // Find the closest point index in the point cloud to the target
    findClosest(target: THREE.Vector3, points: THREE.BufferAttribute): number {
        const targetKeyX = Math.floor(target.x / this.cellSize);
        const targetKeyY = Math.floor(target.y / this.cellSize);
        const targetKeyZ = Math.floor(target.z / this.cellSize);

        let closestDistSq = Infinity;
        let closestIndex = -1;

        // Check the target cell and its 26 neighbors (3x3x3 block)
        // For better accuracy with points near boundary, we check neighbors.
        // If the cell size is small compared to point density, we might need to search wider, 
        // but 1-neighbor radius is standard-ish if cellSize is reasonable.

        const v = new THREE.Vector3();

        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const key = `${targetKeyX + x},${targetKeyY + y},${targetKeyZ + z}`;
                    const indices = this.cells.get(key);

                    if (indices) {
                        for (const index of indices) {
                            v.fromBufferAttribute(points, index);
                            const distSq = target.distanceToSquared(v);
                            if (distSq < closestDistSq) {
                                closestDistSq = distSq;
                                closestIndex = index;
                            }
                        }
                    }
                }
            }
        }

        // Fallback: If no points found in neighbors, we might need to expand search or search all.
        // This is a tradeoff. If the hashing is sparse, this might fail.
        // To be safe in a "skinning" usage where meshes largely overlap:
        // If closestIndex is still -1, do a brute force (slow but safe fallback).
        if (closestIndex === -1) {
            // console.warn('SpatialHash: No points found in neighborhood, falling back to brute force for a vertex.');
            closestDistSq = Infinity;
            for (let i = 0; i < points.count; i++) {
                v.fromBufferAttribute(points, i);
                const distSq = target.distanceToSquared(v);
                if (distSq < closestDistSq) {
                    closestDistSq = distSq;
                    closestIndex = i;
                }
            }
        }

        return closestIndex;
    }
}


/**
 * Transfers skin weights from a rigged body to a static garment.
 * @param bodyMesh The rigged SkinnedMesh (the avatar).
 * @param garmentMesh The static Mesh (the t-shirt).
 */
export function transferWeights(bodyMesh: THREE.SkinnedMesh, garmentMesh: THREE.Mesh): THREE.SkinnedMesh {
    const bodyPos = bodyMesh.geometry.attributes.position as THREE.BufferAttribute;
    const bodyIndex = bodyMesh.geometry.attributes.skinIndex as THREE.BufferAttribute;
    const bodyWeight = bodyMesh.geometry.attributes.skinWeight as THREE.BufferAttribute;

    if (!bodyIndex || !bodyWeight) {
        throw new Error("Body mesh must have skinIndex and skinWeight attributes.");
    }

    const garmentPos = garmentMesh.geometry.attributes.position as THREE.BufferAttribute;
    const vertexCount = garmentPos.count;

    // Create new buffers for the garment
    const newIndices = new Float32Array(vertexCount * 4);
    const newWeights = new Float32Array(vertexCount * 4);

    const tempV3 = new THREE.Vector3();

    // 1. Build Spatial Hash from Body Vertices
    // Calculate average distance between vertices to determine good cell size? 
    // Or just use a heuristic like 1/100 of bounding box diagonal.
    // Fixed size 0.05 (5cm) is usually okay for human scale (roughly 1.8m tall).
    const spatialHash = new SpatialHash(bodyPos, 0.02); // 2cm cells for finer granularity

    // 2. Iterate over Garment Vertices
    for (let i = 0; i < vertexCount; i++) {
        tempV3.fromBufferAttribute(garmentPos, i);

        // Find closest body vertex using Spatial Hash
        const closestIndex = spatialHash.findClosest(tempV3, bodyPos);

        // Fallback protection if something went wrong (should be covered by brute force fallback in class)
        if (closestIndex === -1) continue;

        // Copy the 4 bone indices and weights
        // Copy the 4 bone indices and weights from the closest body vertex
        const i4 = i * 4;
        newIndices[i4 + 0] = bodyIndex.getX(closestIndex);
        newIndices[i4 + 1] = bodyIndex.getY(closestIndex);
        newIndices[i4 + 2] = bodyIndex.getZ(closestIndex);
        newIndices[i4 + 3] = bodyIndex.getW(closestIndex);

        newWeights[i4 + 0] = bodyWeight.getX(closestIndex);
        newWeights[i4 + 1] = bodyWeight.getY(closestIndex);
        newWeights[i4 + 2] = bodyWeight.getZ(closestIndex);
        newWeights[i4 + 3] = bodyWeight.getW(closestIndex);
    }

    // 3. Create SkinnedMesh
    const garmentGeometry = garmentMesh.geometry.clone(); // Clone to avoid mutating original if needed
    garmentGeometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(newIndices, 4));
    garmentGeometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(newWeights, 4));

    const newSkinnedGarment = new THREE.SkinnedMesh(garmentGeometry, garmentMesh.material);

    // Bind to the same skeleton
    newSkinnedGarment.bind(bodyMesh.skeleton, bodyMesh.bindMatrix);

    // Important: The garment geometry needs to be relative to the bind matrix/bones now?
    // Usually standard skinning assumes vertices are in "bind pose" relative to the bones.
    // If the garment meshes are pre-aligned (which the user said earlier), this works.

    return newSkinnedGarment;
}
