# quran-relations

This visual explorer is result of an idea to determine relationships between ayats of Holy Quran, by using the subject matters they 
discuss about. We used Farhang-e-Quran to extract subjects present in each ayat.

## How to use
Just open index.html in your favourite browser:
https://sjnaficy.github.io/quran-relations/

## How it works
If two ayat discuss about same subjects they are considered related.
The more common subjects between ayats, means they're more strongly related.

In order to find subjects present in each ayat, a text-extraction was performed on online volumes of Farhang-e-Quran.
Then a simple algorithm was used for find relationships:
1. Ayat pairs which have more subjects in common, and less differences, are considered more related.
2. Not all subjects have an equal score. More broad and generic subjects contribute less score for ayat relationship strength, while 
   more specific ones contribute more.

## How to extend/contribute
You're welcome to extend the work by using another source for ayat's subjects, or another way of calculating the relationship strength
or in any other way. Visualized data is contained in two files:
1. *graph.js* represents the matrix of relations between ayats and its score.
   A single array, named ayat is used for all ayats. Each element is in the form of:
   
   `"1:2": [ {"id":"1:4", "score":0.2}, ... ]`
   
   * `"1:2"` means the 1st surah's 2nd ayat. It's a node in the relationship graph. Then comes an array of edges of this node.
   * `"id":"1:4"` shows that the first edge's target is another ayat: 1st surah's 4th ayat.
   * `"score":0.2` shows the weight of the edge, or the strength of the relationship.
   * This can be repeated to show relationships of multiple ayats to the "1:2".
   
2. *subject.js* holds the description of all subjects. This file is very dependent on the structure of Farhang-e-Quran, 
   so if you want to change it, you should also change the main source.
   
Other (static) metadata about quran is contained in:
1. *quranmeta.js* (surah names, etc.), 
2. *quran-simple-min.js* (text of quran based on tanzil.net project)

## Based on 
* Farhang-e-Quran (http://www.maarefquran.com/Files/bookfarhang/farhangbooks.php)
* Tanzil project (http://tanzil.net/)
* JavaScript InfoVis Toolkit (https://philogb.github.io/jit/docs.html)
* JQuery (http://jquery.com/) and JQuery UI (http://jqueryui.com/)
