export default function (value) {
    const positive = Math.abs(value);
    const hours = Math.floor(positive / 60 / 60);
    const minutes = Math.floor(positive / 60) - (hours * 60);
    const seconds = Math.floor(positive % 60);

    return `${value < 0 ? '-' : ''}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
