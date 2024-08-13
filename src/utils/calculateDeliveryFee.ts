function calculateDeliveryFee(distance: number): number {
    if (distance <= 5) {
        return 5.0; // Até 5 km
    } else if (distance <= 10) {
        return 10.0; // Entre 5 km e 10 km
    } else {
        return 15.0; // Acima de 10 km
    }
}
