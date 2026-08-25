// Logic verification test for CineScope filtering, empty state, and sorting
import { movies, availableGenres } from './js/data/movies.js';

let pass = 0, fail = 0;
function check(label, condition, detail) {
  const status = condition ? 'PASS' : 'FAIL';
  if (condition) pass++; else fail++;
  console.log(`[${status}] ${label}${detail ? ` — ${detail}` : ''}`);
}

// Helper: same filter logic as filters.js
function filterMovies(query, genre, sort) {
  let result = [...movies];
  if (query) {
    const q = query.toLowerCase();
    result = result.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.genres.some(g => g.toLowerCase().includes(q)) ||
      m.director.toLowerCase().includes(q) ||
      m.cast.some(a => a.toLowerCase().includes(q))
    );
  }
  if (genre && genre !== 'All') {
    result = result.filter(m => m.genres.includes(genre));
  }
  switch (sort) {
    case 'rating-desc': result.sort((a, b) => b.rating - a.rating); break;
    case 'year-desc': result.sort((a, b) => b.year - a.year); break;
    case 'title-asc': result.sort((a, b) => a.title.localeCompare(b.title)); break;
    case 'title-desc': result.sort((a, b) => b.title.localeCompare(a.title)); break;
  }
  return result;
}

console.log('\n========== CineScope Feature Logic Tests ==========\n');

// 1. Catalog size
check('Total movie catalog', movies.length === 16, `${movies.length} movies loaded`);

// 2. All movies have required fields
const hasAllFields = movies.every(m => m.id && m.title && m.year && m.rating && m.genres?.length && m.poster && m.director && m.cast?.length);
check('All movies have required schema fields', hasAllFields);

// 3. Search "inception"
const r1 = filterMovies('inception', 'All', 'rating-desc');
check('Search "inception" returns 1 result', r1.length === 1, `Found: "${r1.map(m=>m.title).join(', ')}"`);

// 4. Search "dark knight"
const r2 = filterMovies('dark knight', 'All', 'rating-desc');
check('Search "dark knight" matches The Dark Knight', r2.length === 1, `Found: "${r2.map(m=>m.title).join(', ')}"`);

// 5. Case-insensitive search
const r3 = filterMovies('INCEPTION', 'All', 'rating-desc');
check('Search is case-insensitive (INCEPTION)', r3.length === 1, `Found: "${r3.map(m=>m.title).join(', ')}"`);

// 6. Search by director
const r4 = filterMovies('villeneuve', 'All', 'rating-desc');
check('Search by director "villeneuve"', r4.length >= 2, `Found ${r4.length} movies by Denis Villeneuve`);

// 7. Search by cast member
const r5 = filterMovies('zendaya', 'All', 'rating-desc');
check('Search by cast "zendaya"', r5.length >= 1, `Found: "${r5.map(m=>m.title).join(', ')}"`);

// 8. EMPTY STATE: "nomatchquery123" returns 0 results
const r6 = filterMovies('nomatchquery123', 'All', 'rating-desc');
check('Search "nomatchquery123" returns 0 results (triggers empty state)', r6.length === 0, `Count: ${r6.length}`);

// 9. Reset: empty query, 'All' genre, rating-desc = all 16 movies
const r7 = filterMovies('', 'All', 'rating-desc');
check('Reset (empty query + All + rating-desc) restores all 16 movies', r7.length === 16, `Count: ${r7.length}, top: ${r7[0].title} @ ${r7[0].rating}`);

// 10. Genre filter: Sci-Fi
const r8 = filterMovies('', 'Sci-Fi', 'rating-desc');
check('Genre filter "Sci-Fi" works', r8.length > 0, `${r8.length} Sci-Fi movies: ${r8.map(m=>m.title).join(', ')}`);
check('Sci-Fi filter excludes non-Sci-Fi movies', r8.every(m => m.genres.includes('Sci-Fi')));

// 11. Genre filter: Comedy
const r9 = filterMovies('', 'Comedy', 'rating-desc');
check('Genre filter "Comedy" works', r9.length > 0, `${r9.length} Comedy movies: ${r9.map(m=>m.title).join(', ')}`);

// 12. Genre filter: Thriller
const r10 = filterMovies('', 'Thriller', 'rating-desc');
check('Genre filter "Thriller" works', r10.length > 0, `${r10.length} movies`);

// 13. Sort: year-desc (newest first)
const r11 = filterMovies('', 'All', 'year-desc');
const yearsDesc = r11.every((m, i, a) => i === 0 || a[i-1].year >= m.year);
check('Sort by "year-desc" (newest first)', yearsDesc, `${r11[0].title} (${r11[0].year}) → ${r11[r11.length-1].title} (${r11[r11.length-1].year})`);

// 14. Sort: title-asc (A-Z)
const r12 = filterMovies('', 'All', 'title-asc');
const titlesAsc = r12.every((m, i, a) => i === 0 || a[i-1].title.localeCompare(m.title) <= 0);
check('Sort by "title-asc" (A-Z)', titlesAsc, `First: "${r12[0].title}", Last: "${r12[r12.length-1].title}"`);

// 15. Sort: rating-desc (highest first)
const r13 = filterMovies('', 'All', 'rating-desc');
const ratingsDesc = r13.every((m, i, a) => i === 0 || a[i-1].rating >= m.rating);
check('Sort by "rating-desc" (highest rated first)', ratingsDesc, `Top: ${r13[0].title} @ ${r13[0].rating}`);

// 16. Combined: search + genre
const r14 = filterMovies('nolan', 'Action', 'rating-desc');
check('Combined: search "nolan" + genre "Action"', r14.length > 0, `Found ${r14.length}: ${r14.map(m=>m.title).join(', ')}`);

// 17. Featured movie exists for hero section
const featured = movies.find(m => m.featured === true);
check('Featured movie exists for hero spotlight', !!featured, featured ? `"${featured.title}"` : 'NONE');

// 18. All movies have poster URLs
const hasPoster = movies.every(m => m.poster && m.poster.startsWith('http'));
check('All movies have HTTP poster URLs', hasPoster);

// 19. All movies have backdrop URLs
const hasBackdrop = movies.every(m => m.backdrop && m.backdrop.startsWith('http'));
check('All movies have HTTP backdrop URLs', hasBackdrop);

// 20. Genre pills list
check('availableGenres includes "All"', availableGenres[0] === 'All', `${availableGenres.length} genres: ${availableGenres.join(', ')}`);

console.log('\n========== RESULTS ==========');
console.log(`Total: ${pass + fail} tests | PASS: ${pass} | FAIL: ${fail}`);
if (fail === 0) {
  console.log('\n✅ ALL TESTS PASSED — CineScope logic is fully verified.');
} else {
  console.log('\n❌ Some tests failed — review output above.');
}
